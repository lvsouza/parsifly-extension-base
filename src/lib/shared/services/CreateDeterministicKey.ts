

export const createDeterministicKey = (base: string, params: unknown[]): string => {
  const normalized = [...params]
    .map(v => JSON.stringify(v))
    .sort()
    .join('|')

  return `${base}|${normalized}`
}
