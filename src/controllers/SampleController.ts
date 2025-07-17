import { NextFunction, Request, Response } from 'express';

export const SampleController = (req: Request, res: Response, next: NextFunction) => {
    // READONLY with generics
    type Readonly<T> = {
        readonly [P in keyof T]: T[P];
    };

    interface User {
        id: number;
        name: string;
        email: string;
        username: string;
    }

    interface User {
        age?: number;
        display?(): string;
    }

    const user: Readonly<Omit<User, 'username' | 'email'>> = {
        id: 3,
        name: 'Andrey',
        age: 34,
    };

    const updateUser: Omit<User, 'id' | 'email'> = {
        name: 'Andrey',
        username: 'andreypedro',
    };

    type typedAwaited = Awaited<Promise<string>>;
    type requiredProps = Required<User>;
    type nonNullable = NonNullable<string | number | null | undefined>;

    const returnedUser = {
        id: 33,
        name: 'José',
        email: 'jose@jose.com',
    };

    const newUser: User = Object.create(returnedUser);
    console.log('newUser', newUser);

    const great = (name: string): void => {
        console.log(`Hiiiiiiii ${name}!!!!`);
    };

    const print = (cb: (a: string) => void): void => {
        cb('Andrey');
    };

    print(great);

    //user.name = 'KJddd'

    type Coordinate = [number, number];
    const coordinate: Coordinate = [3333, 22322];

    type Name = {
        name: string;
    };

    type Age = {
        age: number;
    };

    type Person = Name & Age;

    const person: Person = {
        name: 'JOse',
        age: 3434,
    };

    const myArr2 = [1, 2, 3, 45, 6, 7, 7, 7, 86, 5, 4, 4];

    for (let num of myArr2) {
        console.log(num);
    }

    const binarySearch = (arr: number[], target: number): number => {
        let low = 0;
        let high = arr.length - 1;

        while (low <= high) {
            const mid = low + Math.floor((high - low) / 2);

            if (arr[mid] === target) {
                return mid;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return -1;
    };

    type BinarySearchParameter = Parameters<typeof binarySearch>;

    type BinarySearchReturn = ReturnType<typeof binarySearch>;

    const obj = Object.create({ id: 1 });

    // explain how to do a binary search
    const sortedArray = [1, 5, 8, 12, 16, 23, 28, 30, 35, 40, 45, 50, 55, 60];
    console.log(`Searching for 23 in [${sortedArray}]:`);
    const index23 = binarySearch(sortedArray, 23);
    console.log(`Index of 23: ${index23}`); // Expected: 5

    // ordering a string array
    // console.log('string ordered', ['apple', 'orange', 'pinaple', 'lemon'].sort((a, b) => a.localeCompare(b)))

    // ordering a date
    // console.log('date ordered', ['2025-10-03', '2025-08-06', '2024-03-01'].sort((a, b) => new Date(a).getTime() - new Date().getTime()))

    // identify how many times each numbers appears
    const myArray = [0, 3, 1, 8, 3, 3, 6, 7, 3, 1, 3, 5, 6, 7, 2];

    const myMap = new Map();

    myArray.map((num) => {
        const count = myMap.get(num) ? myMap.get(num) + 1 : 1;
        myMap.set(num, count);
    });

    // console.log(myMap)

    res.send();
};
