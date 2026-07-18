import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useDeviceID() {
    const [deviceID, setDeviceID] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            let storedID = localStorage.getItem('omr_device_id');
            if (!storedID) {
                storedID = uuidv4();
                localStorage.setItem('omr_device_id', storedID);
            }
            setDeviceID(storedID);
        }
    }, []);

    return deviceID;
}
