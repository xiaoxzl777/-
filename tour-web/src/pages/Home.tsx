import { ArrowRight, BookmarkSimple, ChatCircleText, Path } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Mood, Poi } from '../api/types';
import { poiApi } from '../api/user';
import Illustration from '../components/Illustration';
import PoiCard from '../components/PoiCard';
import XiaoAvatar from '../components/XiaoAvatar';

const EXAMPLES = ['周六带爸妈逛老城区，预算 500', '一个人看博物馆，轻松点', '周日带孩子去长隆'];
const FILTERS = ['全部', '历史人文', '自然风光', '亲子', '博物馆'];
const MOODS: { mood: Mood; name: string; line: string }[] = [
  { mood: 'PROUD', name: '得意', line: '哼，这种行程对我来说小菜一碟。' },
  { mood: 'ANNOYED', name: '不耐烦', line: '喂，我是帮你排行程的，可不是来写作业的。' },
  { mood: 'CARING', name: '关心', line: '周一省博闭馆，我帮你换掉了，别白跑。' },
  { mood: 'THINKING', name: '思考', line: '……让我想想怎么走最顺路。' },
];

export default function Home() {
  const navigate = useNavigate();
  const [ask, setAsk] = useState('');
  const [pois, setPois] = useState<Poi[] | null>(null);
  const [filter, setFilter] = useState('全部');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    poiApi.list({ type: 'SCENIC', size: 50 })
      .then(page => setPois(page.list))
      .catch(() => setPois([]));
  }, []);

  const shown = useMemo(() => {
    const list = (pois ?? []).filter(p => filter === '全部' || p.tags.includes(filter));
    return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5);
  }, [pois, filter]);

  const start = (text: string) => {
    if (!text.trim()) {
      inputRef.current?.focus();
      return;
    }
    navigate('/chat', { state: { prompt: text.trim() } });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    start(ask);
  };

  // 首屏插画随鼠标产生视差
  const onParallax = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--px', (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
    event.currentTarget.style.setProperty('--py', (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
  };

  return (
    <div className="home">
      <section className="wrap hero">
        <div className="hero-copy">
          <p className="eyebrow reveal">广州 · 一日游行程规划</p>
          <h1 className="reveal" style={{ '--i': 1 } as React.CSSProperties}>说一句话，<br />排好一天的广州</h1>
          <p className="hero-lead reveal" style={{ '--i': 2 } as React.CSSProperties}>
            告诉小萧哪天出门、带谁、预算多少，他会<span className="nw">避开闭馆、</span><span className="nw">算好路程，</span>排出一份走得通的行程。
          </p>
          <form className="ask reveal" style={{ '--i': 3 } as React.CSSProperties} onSubmit={onSubmit}>
            <XiaoAvatar mood="PROUD" size={44} className="ask-avatar" />
            <input ref={inputRef} className="ask-input" value={ask} onChange={e => setAsk(e.target.value)}
              placeholder="跟小萧说说你的出行想法" aria-label="出行想法" maxLength={500} />
            <button type="submit" className="btn">
              <span className="btn-label">开始规划</span><ArrowRight size={18} weight="bold" className="ic-arrow" />
            </button>
          </form>
          <div className="hero-chips reveal" style={{ '--i': 4 } as React.CSSProperties}>
            {EXAMPLES.map(text => (
              <button key={text} type="button" className="chip" onClick={() => start(text)}>{text}</button>
            ))}
          </div>
        </div>
        <div className="hero-media anim-host" onMouseMove={onParallax}>
          <Illustration name="hero" alt="广州塔和珠江，前景是木棉花" className="hero-main" />
          <Illustration name="dim-sum" alt="早茶点心" className="hero-sub" />
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>热门景点</h2>
          <div className="tabs" role="tablist" aria-label="按兴趣筛选">
            {FILTERS.map(name => (
              <button key={name} type="button" className="tab" role="tab" aria-selected={filter === name} onClick={() => setFilter(name)}>
                {name}
              </button>
            ))}
          </div>
          <Link to="/pois" className="link push">全部景点<ArrowRight size={16} weight="bold" className="ic" /></Link>
        </div>
        {pois === null ? (
          <div className="bento">
            {[0, 1, 2, 3, 4].map(i => <div key={i} className={`skeleton ${i === 0 ? 'is-feature' : ''}`} />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="empty">
            <h3>暂时没有景点数据</h3>
            <p>确认后端已经启动，或者换个筛选条件看看。</p>
          </div>
        ) : (
          <div className="bento" key={filter}>
            {shown.map((poi, i) => <PoiCard key={poi.id} poi={poi} feature={i === 0} index={i} />)}
          </div>
        )}
      </section>

      <section className="band">
        <div className="wrap how">
          <div>
            <h2>三步排好一天</h2>
            <ol className="how-list">
              <li>
                <span className="how-icon"><ChatCircleText size={24} /></span>
                <div><h3>跟小萧说想法</h3><p>哪天、几个人、预算、想去哪，想到什么说什么，没说的他会用默认值。</p></div>
              </li>
              <li>
                <span className="how-icon"><Path size={24} /></span>
                <div><h3>小萧排出行程</h3><p>按开放时间和路程一站站往后排，中午自动安排吃饭，闭馆和超预算会提醒你。</p></div>
              </li>
              <li>
                <span className="how-icon"><BookmarkSimple size={24} /></span>
                <div><h3>改一改就保存</h3><p>接着跟他说“带上爸妈”，或者直接改条件、删掉某一站，满意了再保存。</p></div>
              </li>
            </ol>
            <Link to="/chat" className="btn">去问小萧<ArrowRight size={18} weight="bold" className="ic-arrow" /></Link>
          </div>
          <div className="moods panel">
            <div className="moods-head">
              <b>这是小萧</b>
              <span>傲娇的小男生，嘴上不太客气，其实很上心</span>
            </div>
            <ul className="moods-list">
              {MOODS.map(item => (
                <li key={item.mood}>
                  <XiaoAvatar mood={item.mood} size={56} />
                  <div><b>{item.name}</b><p>{item.line}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
