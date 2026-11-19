import mappings from '../data/redirects.json';

/** Match only approved paths within this build's mount point; never carry suffixes. */
export function excludedDestination(pathname: string, base = '/') {
  const mount = base.replace(/\/+$/, '');
  if (mount && pathname !== mount && !pathname.startsWith(mount + '/'))
    return null;
  const local =
    (pathname.slice(mount.length) || '/').replace(/\/+$/, '') || '/';
  for (const mapping of mappings) {
    if (mapping.status !== 'resolved' || !mapping.destination) continue;
    const wildcard = '/[...slug]';
    if (mapping.source.endsWith(wildcard)) {
      const prefix = mapping.source.slice(0, -wildcard.length);
      if (local === prefix || local.startsWith(prefix + '/'))
        return mapping.destination;
    } else if (local === mapping.source) return mapping.destination;
  }
  return null;
}

/** Emit real redirect documents for the explicit, finite inventory, not wildcards. */
export const knownRedirects = mappings.filter(
  (mapping) =>
    mapping.status === 'resolved' &&
    mapping.destination &&
    !mapping.source.includes('['),
);
