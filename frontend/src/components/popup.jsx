import React, { useEffect, useState } from 'react';
import '@/styles/Popup.css'; // Create a CSS file for styling
import 'bootstrap/dist/css/bootstrap.min.css';

const Popup = ({ isOpen, onClose, type, message }) => {
    const isSuccess = type === 'success';
    const [fadeOut, setFadeOut] = useState(false); // New state for fade out

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setFadeOut(true); // Trigger fade out
                setTimeout(() => {
                    onClose(); // Close after fading
                }, 300); // Wait for fade-out duration
            }, 1500); // Auto-close after 5000ms (5 seconds)

            // Cleanup the timer on component unmount or when isOpen changes
            return () => {
                clearTimeout(timer);
                setFadeOut(false); // Reset fadeOut when closing
            };
        }
    }, [isOpen, onClose]);

    return (
        <>
            {isOpen && (
                <div className={`modal fade show ${fadeOut ? 'fade-out' : ''}`} style={{ display: 'block' }} id={`${type}Popup`} tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
                        <div className="modal-content">
                            <div className="modal-body text-center p-lg-4">
                                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
                                    <circle
                                        className="path circle"
                                        fill="none"
                                        stroke={isSuccess ? "#198754" : "#db3646"}
                                        strokeWidth="6"
                                        strokeMiterlimit="10"
                                        cx="65.1"
                                        cy="65.1"
                                        r="62.1"
                                    />
                                    {isSuccess ? (
                                        <polyline
                                            className="path check"
                                            fill="none"
                                            stroke="#198754"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeMiterlimit="10"
                                            points="100.2,40.2 51.5,88.8 29.8,67.5"
                                        />
                                    ) : (
                                        <>
                                            <line
                                                className="path line"
                                                fill="none"
                                                stroke="#db3646"
                                                strokeLinecap="round"
                                                strokeMiterlimit="10"
                                                x1="34.4"
                                                y1="37.9"
                                                x2="95.8"
                                                y2="92.3"
                                            />
                                            <line
                                                className="path line"
                                                fill="none"
                                                stroke="#db3646"
                                                strokeLinecap="round"
                                                strokeMiterlimit="10"
                                                x1="95.8"
                                                y1="38"
                                                x2="34.4"
                                                y2="92.2"
                                            />
                                        </>
                                    )}
                                </svg>
                                <h4 className={isSuccess ? "text-success mt-3" : "text-danger mt-3"}>
                                    {isSuccess ? 'Success!' : 'Error!'}
                                </h4>
                                <p className="mt-3">
                                    {message} {/* Display the custom message */}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Popup;
