import type { Mood } from '../api/types';

/**
 * 小萧的头像：傲娇的小男生，4 种表情（得意、不耐烦、关心、思考）。
 * 画风和景点插画统一，颜色走 --xx-* 令牌。
 */
interface Props {
  mood?: Mood;
  size?: number;
  className?: string;
}

const LABELS: Record<Mood, string> = {
  PROUD: '得意',
  ANNOYED: '不耐烦',
  CARING: '关心',
  THINKING: '思考',
};

export default function XiaoAvatar({ mood = 'PROUD', size = 40, className = '' }: Props) {
  return (
    <span className={`xx ${className}`} style={{ width: size, height: size }} role="img" aria-label={`小萧（${LABELS[mood]}）`}>
      <svg key={mood} className="xx-face" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="48" fill="var(--xx-bg)" />
        {/* 衣服 */}
        <path d="M16 96C19 80 32 72 48 72C64 72 77 80 80 96Z" fill="var(--xx-shirt)" />
        <path d="M38 73L48 86L58 73C55 72 51 71 48 71C45 71 41 72 38 73Z" fill="var(--xx-collar)" />
        {/* 脖子、耳朵、脸 */}
        <rect x="42" y="62" width="12" height="12" rx="5" fill="var(--xx-skin-shade)" />
        <circle cx="26.5" cy="50" r="5" fill="var(--xx-skin)" />
        <circle cx="69.5" cy="50" r="5" fill="var(--xx-skin)" />
        <ellipse cx="48" cy="48" rx="21" ry="22" fill="var(--xx-skin)" />
        {/* 头发和呆毛 */}
        <path
          d="M26 47C24 30 34 19 48 19C62 19 72 29 70 47C67 41 64 37 60 35C58 39 53 41 47 40C50 37 51 34 50 31C46 36 39 39 31 39C30 42 28 44 26 47Z"
          fill="var(--xx-hair)"
        />
        <path d="M49 20C49 12 54 7 60 7C56 10 54 14 54 20Z" fill="var(--xx-hair)" className="xx-ahoge" />
        <Expression mood={mood} />
      </svg>
    </span>
  );
}

function Expression({ mood }: { mood: Mood }) {
  const line = { stroke: 'var(--xx-line)', strokeWidth: 2.4, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mood) {
    case 'ANNOYED':
      return (
        <g>
          {/* 皱眉、斜眼、撇嘴，头顶一个生气符号 */}
          <path d="M33 42L42 45M63 42L54 45" {...line} />
          <path d="M34 50H42M54 50H62" {...line} strokeWidth={2} />
          <circle cx="40" cy="52" r="2.2" fill="var(--xx-line)" />
          <circle cx="60" cy="52" r="2.2" fill="var(--xx-line)" />
          <path d="M42 62Q45 60 48 62Q51 64 54 62" {...line} strokeWidth={2.2} />
          <g className="xx-mark" stroke="var(--il-warm)" strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M74 20q3 4 0 8M78 16q4 3 8 0M82 30q-3-4 0-8M86 26q-4-3-8 0" />
          </g>
        </g>
      );
    case 'CARING':
      return (
        <g>
          {/* 眉头轻抬、眼睛看向一边、脸红、小小的笑 */}
          <path d="M34 43Q38 40 42 42M54 42Q58 40 62 43" {...line} strokeWidth={2} />
          <ellipse cx="39" cy="51" rx="3" ry="3.6" fill="var(--xx-line)" />
          <ellipse cx="57" cy="51" rx="3" ry="3.6" fill="var(--xx-line)" />
          <circle cx="38" cy="49.6" r="1" fill="var(--xx-skin)" />
          <circle cx="56" cy="49.6" r="1" fill="var(--xx-skin)" />
          <ellipse cx="33" cy="58" rx="4.5" ry="2.6" fill="var(--xx-blush)" opacity=".55" />
          <ellipse cx="63" cy="58" rx="4.5" ry="2.6" fill="var(--xx-blush)" opacity=".55" />
          <path d="M44 61Q48 64 52 61" {...line} strokeWidth={2.2} />
        </g>
      );
    case 'THINKING':
      return (
        <g>
          {/* 一边眉毛挑起、眼睛往上看，旁边三个点 */}
          <path d="M33 41Q37 38 42 40M54 43H62" {...line} strokeWidth={2} />
          <ellipse cx="39" cy="49" rx="3" ry="3.6" fill="var(--xx-line)" />
          <ellipse cx="58" cy="49" rx="3" ry="3.6" fill="var(--xx-line)" />
          <path d="M45 62H52" {...line} strokeWidth={2.2} />
          <g className="xx-dots" fill="var(--accent)">
            <circle cx="72" cy="22" r="2.8" />
            <circle cx="80" cy="18" r="2.8" />
            <circle cx="88" cy="14" r="2.8" />
          </g>
        </g>
      );
    case 'PROUD':
    default:
      return (
        <g>
          {/* 半眯眼、挑眉、嘴角一边翘起，旁边一颗星 */}
          <path d="M33 42Q37 38 42 40M54 40Q59 38 63 41" {...line} strokeWidth={2.2} />
          <path d="M34 50Q38 47 42 50M54 50Q58 47 62 50" {...line} />
          <path d="M42 60Q47 63 54 58" {...line} strokeWidth={2.2} />
          <path className="xx-star" d="M78 16L80 22L86 24L80 26L78 32L76 26L70 24L76 22Z" fill="var(--il-warm-2)" />
        </g>
      );
  }
}
