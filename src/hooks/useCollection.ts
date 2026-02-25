import { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryConstraint, query } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UseCollectionResult<T> {
    data: T[];
    loading: boolean;
    error: string | null;
}

export function useCollection<T>(
    collectionName: string,
    ...queryConstraints: QueryConstraint[]
): UseCollectionResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        let q;
        try {
            const ref = collection(db, collectionName);
            q = query(ref, ...queryConstraints);
        } catch (err) {
            // Fallback or error if db not init
            setError('Database not initialized');
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const results: T[] = [];
                snapshot.docs.forEach(doc => {
                    results.push({ id: doc.id, ...doc.data() } as T);
                });
                setData(results);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName]); // queryConstraints not in dependency array to avoid infinite loop if passed inline

    return { data, loading, error };
}
