export function difference<T extends string>(arrOne: T[], arrTwo: T[]): T[] {
  return arrOne.filter((x) => !arrTwo.includes(x))
}
