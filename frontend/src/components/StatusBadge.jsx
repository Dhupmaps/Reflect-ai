import React from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const currentStatus = status ? status.toLowerCase() : 'idle';

    // Map status string to class name
    let statusClass = 'idle';
    if (['drafting', 'critiquing', 'refining', 'completed'].includes(currentStatus)) {
        statusClass = currentStatus;
    }

    const isAnimating = ['drafting', 'critiquing', 'refining'].includes(currentStatus);

    // Choose Icon based on status
    let Icon = Circle;
    if (currentStatus === 'completed') Icon = CheckCircle2;
    else if (isAnimating) Icon = Loader2;

    return (
        <div className={`status-badge ${statusClass}`}>
            <Icon
                size={14}
                className={isAnimating ? "spin-animation" : ""}
            />
            {status || 'Idle'}
        </div>
    );
};

export default StatusBadge;