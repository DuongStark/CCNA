import { IconStar } from '../icons';
import styles from './BookmarkButton.module.css';

export default function BookmarkButton({ isBookmarked, onClick, size = 18 }) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${isBookmarked ? styles.active : ''}`}
      onClick={onClick}
      aria-label={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi'}
      title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi'}
    >
      <IconStar
        width={size}
        height={size}
        fill={isBookmarked ? 'currentColor' : 'none'}
      />
    </button>
  );
}
