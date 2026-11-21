import { useEffect } from 'react';

/**
 * Perbarui <title> dan meta description saat berpindah halaman lewat client-side
 * navigation. Untuk permintaan langsung, server (seo.js) sudah mengisi keduanya.
 */
export function useDocumentMeta({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let tag = document.head.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}
