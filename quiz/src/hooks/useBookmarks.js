import { useCallback, useState } from 'react';
import {
  getAll as bmGetAll,
  toggle as bmToggle,
  clearAll as bmClearAll,
} from '../utils/bookmarks';

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => bmGetAll());

  const toggle = useCallback((id) => {
    const isNowBookmarked = bmToggle(id);
    setBookmarks(bmGetAll());
    return isNowBookmarked;
  }, []);

  const isBookmarked = useCallback(
    (id) => !!bookmarks[id],
    [bookmarks]
  );

  const clearAll = useCallback(() => {
    bmClearAll();
    setBookmarks({});
  }, []);

  const count = Object.keys(bookmarks).length;

  return { bookmarks, toggle, isBookmarked, clearAll, count };
}
