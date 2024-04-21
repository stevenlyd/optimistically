export class OptimisticItem<T extends object, K extends object> {
  private readonly _value: T;
  private readonly _metaData: K;

  constructor({ value, metaData }: { value: T; metaData: K }) {
    this._value = value;
    this._metaData = metaData;
  }

  get value(): T {
    return this._value;
  }

  get metaData(): K {
    return this._metaData;
  }

  get fullItem(): T & K {
    return { ...this._value, ...this._metaData };
  }
}
