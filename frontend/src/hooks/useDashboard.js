import { useState, useCallback } from 'react';
import { processData } from '../api';
import { buildPayload } from '../services/dashboardService';

/**
 * Custom hook for managing Dashboard state and operations.
 */
export function useDashboard() {
    const [report, setReport] = useState(null);
    const [rawData, setRawData] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const executeAnalysis = useCallback(async (formState) => {
        setError(null);
        setProcessing(true);
        setReport(null);
        setRawData([]);

        try {
            const payload = buildPayload(formState);
            const data = await processData(payload);

            setReport(data.report);
            const list = data.raw_data?.data || data.raw_data?.properties || [];
            setRawData(Array.isArray(list) ? list : []);

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setProcessing(false);
        }
    }, []);

    const resetDashboard = useCallback(() => {
        setReport(null);
        setRawData([]);
        setError(null);
    }, []);

    return {
        report,
        rawData,
        processing,
        error,
        executeAnalysis,
        resetDashboard
    };
}
