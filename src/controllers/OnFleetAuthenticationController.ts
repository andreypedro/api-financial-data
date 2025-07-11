import axios from "axios";
import { NextFunction, Request, Response } from "express";

export const OnFleetAuthenticationController = async (req: Request, res: Response, next: NextFunction) => {
    
    try {

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'basic cd3b3de84cc1ee040bf06512d233719c:'
            },
        }

        const response = await axios.get('https://onfleet.com/api/v2/auth/test', config)
    
        if(response.status === 401) {
            res.json('Unauthorized')
        }
    }
    catch(err) {

        throw new Error('Error during authentication with OnFleet')
    }
}