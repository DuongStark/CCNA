import { useEffect, useState } from 'react';
import styles from './ExhibitImage.module.css';

export default function ExhibitImage({ src, alt = 'Exhibit' }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!src) return null;

  if (failed) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.fallback}>Image unavailable</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.imageButton}
        onClick={() => setOpen(true)}
        aria-label={`Enlarge ${alt}`}
      >
        <img
          className={styles.image}
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
        />
      </button>

      {open && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            ×
          </button>
          <img
            className={styles.lightboxImage}
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
