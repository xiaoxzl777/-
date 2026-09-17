import { Link } from 'react-router';
import XiaoAvatar from '../components/XiaoAvatar';

export default function NotFound() {
  return (
    <div className="wrap page">
      <div className="empty">
        <XiaoAvatar mood="ANNOYED" size={80} />
        <h3>这个页面不存在</h3>
        <p>哼，地址是不是输错了？</p>
        <Link to="/" className="btn is-small">回首页</Link>
      </div>
    </div>
  );
}
