// Function signature types
type Params<F extends (...args: any[]) => any> =
    F extends (...args: infer A) => any
    ? A
    : never;

type Result<F extends (...args: any[]) => any> =
    F extends (...args: any[]) => infer R
    ? R
    : undefined;

type Signature<F extends (...args: any[]) => any> =
    (...args: Params<F>) => Result<F>

// Recursive array types
type Head<T extends any[]> =
    T extends [any, ...any[]]
    ? T[0]
    : never;

type Tail<T extends any[]> =
    T extends [any, ...infer TT]
    ? TT
    : never;

type HasTail<T extends any[]> =
    T extends [] | [any]
    ? false
    : true;

// Curry result type signature (for single argument application)*
type CurryV0<P extends any[], R> =
    (arg: Head<P>) => HasTail<P> extends true
        ? CurryV0<Tail<P>, R>
        : R;

// Using indexed type accessor
type Last<T extends any[]> = {
    0: Last<Tail<T>>
    1: Head<T>,
}[
    HasTail<T> extends true
    ? 0
    : 1
];


type Length<T extends any[]> = T['length'];
type Prepend<K, T extends any[]> = [K, ...T];

type Drop<N extends Number, T extends any[], I extends any[] = []> = {
    0: T,
    1: [],
    2: Drop<N, Tail<T>, Prepend<Head<T>, I>>
}[
    N extends Length<I>
    ? 0
    : HasTail<T> extends false
    ? 1
    : 2
];

type Cast<X, Y> = X extends Y ? X : Y;

type CurryV5<P extends any[], R> =
    <T extends any[]>(...args: Cast<T, Partial<P>>) =>
        Drop<Length<T>, P> extends [any, ...any[]]
        ? CurryV5<Cast<Drop<Length<T>, P>, any[]>, R>
        : R;

// Dummy placeholder declaration
const __ = Symbol()
type __ = typeof __;

type Pos<I extends any[]> = Length<I>;
type Next<I extends any[]> = Prepend<any, I>;
type Prev<I extends any[]> = Tail<I>;

type Iter<I extends number = 0, F extends any[] = [], E extends any[] = []> = {
    0: F,
    1: Iter<I, Next<F>, Next<E>>
}[
    Pos<E> extends I
    ? 0
    : 1
];

type Reverse<T extends any[]> = HasTail<T> extends true ? [...Tail<T>, Head<T>] : T;
type Concat<T1 extends any[], T2 extends any[]> = [...T1, ...T2];
type Append<E, T extends any[]> = [...T, E];

type GapOf<T1 extends any[], T2 extends any[], TN extends any[], I extends any[]> =
    T1[Pos<I>] extends __
    ? Append<T2[Pos<I>], TN>
    : TN;

    
type GapsOf<T1 extends any[], T2 extends any[], TN extends any[] = [], I extends any[] = []> = {
    0: Concat<TN, Cast<Drop<Pos<I>, T2>, any[]>>,
    1: GapsOf<T1, T2, Cast<GapOf<T1, T2, TN, I>, any[]>, Next<I>>
}[
    Pos<I> extends Length<T1>
    ? 0
    : 1
];

type PartialGaps<T extends any[]> = {
    [K in keyof T]?: T[K] | __
};
type CleanedGaps<T extends any[]> = {
    [K in keyof T]: NonNullable<T[K]>
}
type Gaps<T extends any[]> = CleanedGaps<PartialGaps<T>>

type CurryV6<P extends any[], R> =
    <T extends any[]>(...args: Cast<T, Gaps<P>>) =>
        GapsOf<T, P> extends [any, ...any[]]
        ? CurryV6<Cast<GapsOf<T, P>, any[]>, R>
        : R;

type Curry<F extends (...args: any) => any> =
    <T extends any[]>(...args: Cast<Cast<T, Gaps<Params<F>>>, any[]>) =>
        GapsOf<T, Parameters<F>> extends [any, ...any[]]
        ? Curry<(...args: Cast<GapsOf<T, Parameters<F>>, any[]>) => ReturnType<F>>
        : ReturnType<F>

// Test
enum LogStatus {
    SUCCESS = 0,
    FAILURE = 1
};

function logUserData(name: string, age: number, married: boolean, ...moreInfo: string[]) {
    try {
        console.log(name, age, married ? `Married` : `Single`, ...moreInfo);
        return LogStatus.SUCCESS;
    } catch (err: any) {
        // Somehow console.log throws an error, handle it
        return LogStatus.FAILURE;
    }
}

type x = Result<typeof logUserData>
type firstArg = Head<Params<typeof logUserData>>
type restArgs = Tail<Params<typeof logUserData>>
type hasRestArgs = HasTail<Params<typeof logUserData>>


declare function curryV5<P extends any[], R>(f: (...args: P) => R): CurryV5<P, R>

const curriedLog = curryV5(logUserData)
const curriedLog2 = curriedLog('Josh', 36, false, '35', 'false', true, 'alabala') // error on 'true', expects string

declare function curryV6<P extends any[], R>(f: (...args: P) => R): CurryV6<P, R>
const curriedLogV6 = curryV6(logUserData);
const curriedLog2v6 = curriedLogV6(__, 25, __);
const curriedLog3v6 = curriedLog2v6(__, true);
const curriedLog4v6 = curriedLog3v6('Josh', 'Gaming', 'Hiking') // Okay!

// this one doesn't seem to work T-T
declare function curry<F extends (...args: any) => any>(f: F): Curry<F>;
const toCurry = (name: string, age: number, single: true) => true
const curreid = curry(toCurry)
const test2 = curreid(__, 26)('alabala', true) // shouldn't be an error