import { useId, useMemo } from 'react';
import { sceneMarkup } from './illustrations';

interface Props {
  name: string;
  alt: string;
  className?: string;
  /** 景点官网：有的话点击插画在新窗口打开 */
  href?: string | null;
}

/** 景点插画。有官网的景点，插画可以点击进入官网 */
export default function Illustration({ name, alt, className = '', href }: Props) {
  const uid = useId();
  const { viewBox, markup } = useMemo(() => sceneMarkup(name, uid), [name, uid]);
  // 插画内容是代码里写死的 SVG，不含用户输入
  const svg = (
    <svg className="il" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }} />
  );
  if (href) {
    return (
      <a className={`photo is-link ${className}`} href={href} target="_blank" rel="noopener noreferrer"
        title="打开官网" aria-label={`${alt}，打开官网（新窗口）`}>
        {svg}
      </a>
    );
  }
  return <div className={`photo ${className}`} role="img" aria-label={alt}>{svg}</div>;
}
