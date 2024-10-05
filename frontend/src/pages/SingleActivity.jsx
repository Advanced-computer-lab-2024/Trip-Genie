import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { XCircle, CheckCircle, ChevronLeft, Calendar, MapPin, Users, DollarSign, Globe, Accessibility, Star, Edit, Trash2, Mail, Phone, Award } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../components/Loader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ActivityDetail = () => {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(Cookies.get('role') || 'guest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [advertiserProfile, setAdvertiserProfile] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivityDetails = async () => {
      if (!id) {
        setError('Invalid activity ID.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get('jwt');
        const response = await fetch(`http://localhost:4000/${userRole}/activities/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch activity details');
        }

        const data = await response.json();
        setActivity(data);
        setError(null);

        if (data.advertiser) {
          const advertiserResponse = await fetch(`http://localhost:4000/advertiser/${data.advertiser}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!advertiserResponse.ok) {
            throw new Error('Failed to fetch advertiser profile');
          }

          const advertiserData = await advertiserResponse.json();
          setAdvertiserProfile(advertiserData);
        }
      } catch (err) {
        setError('Error fetching activity details. Please try again later.');
        console.error('Error fetching activity details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
  }, [id, userRole]);

  const handleUpdate = () => {
    navigate(`/update-activity/${id}`);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    setDeleteError(null);
    try {
      const token = Cookies.get('jwt');
      const response = await fetch(`http://localhost:4000/${userRole}/activities/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setDeleteError(errorData.message);
          return;
        }
        throw new Error('Failed to delete activity');
      }

      setShowDeleteSuccess(true);
    } catch (err) {
      setError('Error deleting activity. Please try again later.');
      console.error('Error deleting activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold">Your Logo</div>
          </div>
        </div>
      </nav>

      <div className="bg-[#1a202c] text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{activity.name}</h1>
          <p className="text-xl md:text-2xl">{activity.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold">Activity Details</h1>
              <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                <Star className="w-8 h-8 text-yellow-500 mr-2" />
                <span className="text-2xl font-semibold">{activity.rating || 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Location: {activity.location}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Price: ${activity.price}</span>
                </div>
                <div className="flex items-center">
                  <Accessibility className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Accessibility: {activity.accessibility ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Timing: {new Date(activity.timing).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Users className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Advertiser: {advertiserProfile ? advertiserProfile.username : 'Loading...'}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Email: {advertiserProfile ? advertiserProfile.email : 'Loading...'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Phone: {advertiserProfile ? advertiserProfile.phoneNumber : 'Loading...'}</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-6 h-6 mr-2 text-orange-500" />
                  <span className="text-gray-700">Special Discount: {activity.specialDiscount}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between mt-8">
              <Button onClick={() => navigate('/all-activities')} variant="outline">
                <ChevronLeft className="mr-2" /> Back to All Activities
              </Button>
              <div className="flex space-x-2">
                <Button onClick={handleUpdate} variant="default">
                  <Edit className="mr-2" /> Update
                </Button>
                <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive">
                  <Trash2 className="mr-2" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Success Dialog */}
      <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>
              The activity has been deleted successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate('/all-activities')} variant="default">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityDetail;
