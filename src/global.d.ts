interface StringObject<T> {
    [key: string]: T
}

type Nullable<Type> = Type | null;
type Maybe<Type> = Type | undefined;
