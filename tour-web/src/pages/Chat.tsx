import { BookmarkSimple, CaretRight, Check, CheckCircle, PaperPlaneRight, Plus, WarningCircle } from '@phosphor-icons/react';
import { App as AntApp, Input, Modal, Popconfirm } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { errorMessage } from '../api/http';
import type { ChatReply, Conditions, District, Mood, Plan, PlanItem, Poi, Step } from '../api/types';
import { chatApi, poiApi, tripApi } from '../api/user';
import ConditionBar from '../components/ConditionBar';
import ConditionEditor from '../components/ConditionEditor';
import Illustration from '../components/Illustration';
import RouteMap from '../components/RouteMap';
import Timeline, { PlanSummary } from '../components/Timeline';
import XiaoAvatar from '../components/XiaoAvatar';
import { dateLabel, shortName } from '../utils/format';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  mood?: Mood;
  /** GREETING 表示主动问候 */
  intent?: 'PLAN' | 'CHAT' | 'GREETING';
  steps?: Step[];
  status?: 'pending' | 'error';
  /** 出错时可以重发的那句话 */
  retryText?: string;
}

const SUGGESTIONS = ['周六带爸妈逛老城区，想轻松点，预算 500', '明天一个人去看博物馆', '周日带孩子去长隆', '你是谁？'];
const FOLLOW_UPS = ['带上爸妈', '预算改成 300', '紧凑一点，多去几个地方'];
const HISTORY_LIMIT = 10;

export default function Chat() {
  const { message } = AntApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [pois, setPois] = useState<Poi[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [activeSeq, setActiveSeq] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [tab, setTab] = useState<'chat' | 'plan'>('chat');
  const [planDot, setPlanDot] = useState(false);

  // 异步流程里要读到最新的消息和行程，所以同时用 ref 保存一份
  const messagesRef = useRef<Message[]>([]);
  const planRef = useRef<Plan | null>(null);
  const busyRef = useRef(false);
  const idRef = useRef(0);
  const startedRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const commit = (next: Message[]) => {
    messagesRef.current = next;
    setMessages(next);
  };
  const addMessage = (msg: Omit<Message, 'id'>) => {
    const id = ++idRef.current;
    commit([...messagesRef.current, { ...msg, id }]);
    return id;
  };
  const patchMessage = (id: number, patch: Partial<Message>) => {
    commit(messagesRef.current.map(m => (m.id === id ? { ...m, ...patch } : m)));
  };
  const setBusyState = (value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  };
  const applyPlan = (next: Plan | null) => {
    planRef.current = next;
    setPlan(next);
  };

  const handleReply = (id: number, reply: ChatReply, promptText?: string) => {
    patchMessage(id, {
      content: reply.reply,
      mood: reply.mood,
      intent: reply.intent,
      steps: reply.plan?.steps,
      status: undefined,
    });
    if (reply.plan) {
      applyPlan(reply.plan);
      setSavedId(null);
      setActiveSeq(null);
      if (promptText) setPrompts(list => [...list, promptText]);
      setPlanDot(true);
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busyRef.current) return;
    const history = messagesRef.current
      .filter(m => !m.status && m.content)
      .slice(-HISTORY_LIMIT)
      .map(m => ({ role: m.role, content: m.content }));
    addMessage({ role: 'user', content: text });
    const id = addMessage({ role: 'assistant', content: '', mood: 'THINKING', status: 'pending' });
    setBusyState(true);
    try {
      const reply = await chatApi.send({ message: text, history, conditions: planRef.current?.conditions ?? null });
      handleReply(id, reply, text);
    } catch (error) {
      patchMessage(id, { content: errorMessage(error), mood: 'CARING', status: 'error', retryText: text });
    } finally {
      setBusyState(false);
    }
  };

  const retry = (failed: Message) => {
    if (!failed.retryText || busyRef.current) return;
    const index = messagesRef.current.findIndex(m => m.id === failed.id);
    // 去掉出错的回复和对应的那句话，再重发
    commit(messagesRef.current.filter((_, i) => i !== index && i !== index - 1));
    void send(failed.retryText);
  };

  const replan = async (conditions: Conditions) => {
    if (busyRef.current) return;
    const id = addMessage({ role: 'assistant', content: '', mood: 'THINKING', status: 'pending' });
    setBusyState(true);
    try {
      handleReply(id, await chatApi.replan(conditions));
    } catch (error) {
      patchMessage(id, { content: errorMessage(error), mood: 'CARING', status: 'error' });
    } finally {
      setBusyState(false);
    }
  };

  const greet = async () => {
    const id = addMessage({ role: 'assistant', content: '', mood: 'THINKING', status: 'pending' });
    try {
      const greeting = await chatApi.greeting();
      patchMessage(id, { content: greeting.reply, mood: greeting.mood, intent: 'GREETING', status: undefined });
    } catch (error) {
      patchMessage(id, { content: errorMessage(error), mood: 'CARING', status: 'error' });
    }
  };

  // 打开页面：小萧先打招呼；从首页带着一句话过来的，接着把这句话发出去
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const prompt = (location.state as { prompt?: string } | null)?.prompt;
    if (prompt) navigate(location.pathname, { replace: true, state: null });
    void (async () => {
      await greet();
      if (prompt) await send(prompt);
    })();
    Promise.all([poiApi.list({ size: 100 }), poiApi.districts()])
      .then(([poiPage, districtList]) => {
        setPois(poiPage.list);
        setDistricts(districtList);
      })
      .catch(() => { /* 条件标签里显示不了地点名称，不影响对话 */ });
  }, []); // 只在打开页面时执行一次

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const poiNames = useMemo(() => {
    const map = new Map(pois.map(p => [p.id, p.name]));
    plan?.items.forEach(item => map.set(item.poiId, item.name));
    return map;
  }, [pois, plan]);
  const districtNames = useMemo(() => new Map(districts.map(d => [d.id, d.name])), [districts]);

  const removeStop = (item: PlanItem) => {
    if (!plan) return;
    const c = plan.conditions;
    void replan({
      ...c,
      mustPoiIds: c.mustPoiIds.filter(id => id !== item.poiId),
      avoidPoiIds: [...new Set([...c.avoidPoiIds, item.poiId])],
    });
  };

  const removePoi = (kind: 'must' | 'avoid', poiId: number) => {
    if (!plan) return;
    const c = plan.conditions;
    void replan(kind === 'must'
      ? { ...c, mustPoiIds: c.mustPoiIds.filter(id => id !== poiId) }
      : { ...c, avoidPoiIds: c.avoidPoiIds.filter(id => id !== poiId) });
  };

  const newTrip = () => {
    if (busyRef.current) return;
    commit([]);
    applyPlan(null);
    setPrompts([]);
    setSavedId(null);
    setTab('chat');
    setPlanDot(false);
    void greet();
  };

  const openSave = () => {
    if (!plan) return;
    const names = [...new Set(plan.items.filter(i => i.type === 'SCENIC').map(i => shortName(i.name)))].slice(0, 2);
    setTitle(`${dateLabel(plan.conditions.date)} · ${names.join('、')}`.slice(0, 50));
    setSaveOpen(true);
  };

  const save = async () => {
    if (!plan || !title.trim()) return;
    setSaving(true);
    try {
      const id = await tripApi.save({
        title: title.trim(),
        prompt: prompts.join('；').slice(0, 500),
        conditions: plan.conditions,
        items: plan.items,
        totalCost: plan.totalCost,
      });
      setSavedId(id);
      setSaveOpen(false);
      message.success('行程已保存');
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitInput();
    }
  };
  const submitInput = () => {
    if (!input.trim() || busyRef.current) return;
    void send(input);
    setInput('');
  };

  const switchTab = useCallback((next: 'chat' | 'plan') => {
    setTab(next);
    if (next === 'plan') setPlanDot(false);
  }, []);

  const hasItems = Boolean(plan && plan.items.length > 0);
  const lastPlanMessageId = [...messages].reverse().find(m => m.intent === 'PLAN')?.id;

  return (
    <div className="chat-page">
      <div className="chat-head">
        <div>
          <h1>问小萧</h1>
          <p>闲聊也行；说出哪天出门、几个人、想去哪，他就帮你排一天的行程。</p>
        </div>
        <div className="chat-actions">
          <Popconfirm title="开始新行程？" description="当前对话和行程会清空，已保存的行程不受影响。"
            okText="清空" cancelText="取消" onConfirm={newTrip} disabled={busy}>
            <button type="button" className="btn is-secondary is-small" disabled={busy}>
              <Plus size={16} weight="bold" />新行程
            </button>
          </Popconfirm>
          {savedId ? (
            <button type="button" className="btn is-small is-done" onClick={() => navigate(`/trips/${savedId}`)}>
              <Check size={16} weight="bold" />已保存，去看看
            </button>
          ) : (
            <button type="button" className="btn is-small" disabled={!hasItems || busy} onClick={openSave}>
              <BookmarkSimple size={16} weight="bold" />保存行程
            </button>
          )}
        </div>
      </div>

      <div className="chat-tabs tabs" role="tablist">
        <button type="button" className="tab" role="tab" aria-selected={tab === 'chat'} onClick={() => switchTab('chat')}>对话</button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'plan'} onClick={() => switchTab('plan')}>
          行程{planDot && tab !== 'plan' && <span className="tab-dot" aria-label="有新行程" />}
        </button>
      </div>

      <div className={`chat-layout show-${tab}`}>
        <section className="chat-panel panel" aria-label="和小萧的对话">
          <div className="chat-list" ref={listRef} aria-live="polite">
            {messages.map(m => (m.role === 'user' ? (
              <div key={m.id} className="msg is-user"><div className="bubble-user">{m.content}</div></div>
            ) : (
              <div key={m.id} className="msg is-ai">
                <XiaoAvatar mood={m.mood} size={38} className="msg-avatar" />
                <div className="msg-main">
                  <div className="msg-name">
                    小萧
                    {m.intent === 'PLAN' && <span className="tag is-accent">识别为：规划行程</span>}
                    {m.intent === 'CHAT' && <span className="tag is-muted">识别为：闲聊</span>}
                  </div>
                  {m.status === 'pending' && (
                    <div className="bubble-ai is-typing" aria-label="小萧正在想"><i /><i /><i /></div>
                  )}
                  {m.status === 'error' && (
                    <div className="bubble-error">
                      <WarningCircle size={16} className="ic" />
                      <span>{m.content}</span>
                      {m.retryText && <button type="button" className="link" onClick={() => retry(m)}>重试</button>}
                    </div>
                  )}
                  {!m.status && <div className="bubble-ai">{m.content}</div>}
                  {m.steps && m.steps.length > 0 && <StepList steps={m.steps} initialOpen={m.id === lastPlanMessageId} />}
                </div>
              </div>
            )))}
          </div>

          <div className="chat-compose">
            <div className="chat-sugs">
              {(hasItems ? FOLLOW_UPS : SUGGESTIONS).map(text => (
                <button key={text} type="button" className="chip" disabled={busy} onClick={() => send(text)}>{text}</button>
              ))}
            </div>
            <div className="chat-input">
              <Input.TextArea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
                autoSize={{ minRows: 1, maxRows: 4 }} maxLength={500} variant="borderless"
                placeholder={hasItems ? '想怎么改？比如：带上爸妈、预算改成 300' : '跟小萧说说你的出行想法'} aria-label="输入消息" />
              <button type="button" className="icon-btn is-accent" onClick={submitInput} disabled={busy || !input.trim()} aria-label="发送">
                <PaperPlaneRight size={18} weight="fill" />
              </button>
            </div>
          </div>
        </section>

        <section className={`plan-side ${busy ? 'is-busy' : ''}`} aria-label="行程">
          {plan ? (
            <>
              <ConditionBar conditions={plan.conditions} poiNames={poiNames} districtNames={districtNames}
                onEdit={() => setEditorOpen(true)} onRemovePoi={removePoi} disabled={busy} />
              {plan.warnings.length > 0 && (
                <ul className="warnings">
                  {plan.warnings.map(w => <li key={w}><WarningCircle size={16} className="ic" />{w}</li>)}
                </ul>
              )}
              {hasItems ? (
                <div className="plan-grid">
                  <div className="plan-list">
                    <PlanSummary items={plan.items} totalCost={plan.totalCost} conditions={plan.conditions} />
                    <Timeline items={plan.items} activeSeq={activeSeq} onHover={setActiveSeq} onRemove={removeStop} disabled={busy} />
                    <p className="plan-note">开放时间和票价以官网为准；交通按直线距离估算。</p>
                  </div>
                  <RouteMap items={plan.items} activeSeq={activeSeq} onHover={setActiveSeq} />
                </div>
              ) : (
                <div className="empty panel">
                  <Illustration name="mountain" alt="" />
                  <h3>这次没排出来</h3>
                  <p>看看上面的提醒，换个日期或者点条件标签放宽一点。</p>
                </div>
              )}
            </>
          ) : (
            <div className="plan-empty panel anim-host">
              <Illustration name="canton-tower" alt="" />
              <h3>排好的行程会出现在这里</h3>
              <p>在对话框里告诉小萧哪天出门、几个人、想去哪，他会避开闭馆、算好路程，排出时间线和地图。</p>
            </div>
          )}
        </section>
      </div>

      {plan && (
        <ConditionEditor open={editorOpen} conditions={plan.conditions} pois={pois} districts={districts}
          onCancel={() => setEditorOpen(false)}
          onSubmit={conditions => {
            setEditorOpen(false);
            void replan(conditions);
          }} />
      )}

      <Modal open={saveOpen} title="保存行程" okText="保存" cancelText="取消" confirmLoading={saving}
        onOk={save} onCancel={() => setSaveOpen(false)} okButtonProps={{ disabled: !title.trim() }}>
        <p className="muted">给这份行程起个名字，之后可以在“我的行程”里查看。</p>
        <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={50} showCount onPressEnter={save} />
      </Modal>
    </div>
  );
}

function StepList({ steps, initialOpen }: { steps: Step[]; initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div className={`steps-box ${open ? 'is-open' : ''}`}>
      <button type="button" className="steps-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <CaretRight size={12} weight="bold" className="ic" />执行步骤 · {steps.length} 步
      </button>
      {open && (
        <ol className="steps">
          {steps.map((step, i) => (
            <li key={step.title} className="step reveal" style={{ '--i': i } as React.CSSProperties}>
              <CheckCircle size={18} weight="fill" className="step-icon" />
              <div><b>{step.title}</b><small>{step.detail}</small></div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
