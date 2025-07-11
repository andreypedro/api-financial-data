import { NextFunction, Request, Response } from "express";

export const ChallengeController = (req: Request, res: Response, Next:NextFunction) => {

    const findMissingNumber = (arr: Array<number>): number | null => {

        const current = arr[0] // -1
        let missingNumber: number | null = null

        for(let i in arr) {
            
            const nextI = Number(i) + 1

            const nextNumber = arr[nextI]

            if((arr[i] + 1) !== nextNumber) {
                missingNumber = arr[i] + 1
                break;
            }
        }

        return missingNumber
    }

    // -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22

    const myArray = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22]

    const response = findMissingNumber(myArray)

    console.log(response)
}