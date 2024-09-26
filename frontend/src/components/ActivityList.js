import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ActivityList = () => {
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await axios.get('http://localhost:4000/advertiser/activity');
                setActivities(response.data);
            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        };

        fetchActivities();
    }, []);

    // Get the current date and time
    const currentTime = new Date();

    // Filter activities to only show those starting after the current time
    const upcomingActivities = activities.filter(activity => new Date(activity.timeline.start) > currentTime);

    return (
        <div>
            <h1>Upcoming Activity List</h1>
            <ul>
                {upcomingActivities.map(activity => (
                    <li key={activity._id}>
                        <h2>{activity.name}</h2>
                        <p>Location: {activity.location}</p>
                        <p>Duration: {activity.duration} hours</p>
                        <p>Price: ${activity.price}</p>
                        <p>Special Discount: {activity.specialDiscount}%</p>

                        {/* Display Category Names */}
                        <p>Category: {activity.category.map(cat => cat.name).join(', ')}</p>

                        {/* Display Tag Types */}
                        <p>Tags: {activity.tags.map(tag => tag.type).join(', ')}</p>

                        {/* Conditionally Render Advertiser Username */}
                        {activity.advertiser && activity.advertiser.username && (
                            <p>Advertiser: {activity.advertiser.username}</p>
                        )}

                        <p>Booking Open: {activity.isBookingOpen ? 'Yes' : 'No'}</p>
                        <p>Start Time: {new Date(activity.timeline.start).toLocaleString()}</p>
                        <p>End Time: {new Date(activity.timeline.end).toLocaleString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ActivityList;
