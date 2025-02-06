import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit, Plus, CheckCircle, XCircle } from "lucide-react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";
import { AnimatePresence, motion } from "framer-motion";

export function TagsPage() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [editTagId, setEditTagId] = useState(null);
  const [editTagName, setEditTagName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  const fetchTags = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "https://trip-genie-apis.vercel.app/admin/tags",
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTags(response.data);
    } catch (error) {
      console.error("Error fetching Tags:", error);
      showToast("Error fetching Tags", "error");
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const createTag = async () => {
    if (newTag) {
      try {
        const token = Cookies.get("jwt");
        await axios.post(
          "https://trip-genie-apis.vercel.app/admin/tags",
          { type: newTag },
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNewTag("");
        showToast("Tag created successfully!", "success");
        fetchTags();
      } catch (error) {
        showToast("This tag already exists.", "error");
      }
    } else {
      showToast("Please enter a tag name.", "error");
    }
  };

  const updateTag = async () => {
    if (editTagName) {
      try {
        const token = Cookies.get("jwt");
        await axios.put(
          `https://trip-genie-apis.vercel.app/admin/tags/${editTagId}`,
          { type: editTagName },
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        showToast("Tag updated successfully!", "success");
        setEditTagId(null);
        setEditTagName("");
        fetchTags();
      } catch (error) {
        showToast("Tag name already exists", "error");
      }
    } else {
      showToast("Please provide a valid tag name.", "error");
    }
  };

  const deleteTag = async (tagId) => {
    try {
      const token = Cookies.get("jwt");
      await axios.delete(
        `https://trip-genie-apis.vercel.app/admin/tags/${tagId}`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showToast("Tag deleted successfully!", "success");
      fetchTags();
    } catch (error) {
      console.error(
        "Error deleting tag:",
        error.response?.data || error.message
      );
      showToast("Error deleting tag", "error");
    }
  };

  const handleDeleteClick = (tag) => {
    setTagToDelete(tag);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (tagToDelete) {
      deleteTag(tagToDelete._id);
      setShowDeleteModal(false);
      setTagToDelete(null);
    }
  };

  return (
    <div className="min-h-screen">
      <ToastProvider>
        <div className="">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-[#1A3B47]">Create New Tag</h2>
            <div className="flex space-x-4">
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter new tag name"
                className="flex-grow bg-white text-[#1A3B47] border-[#B5D3D1]"
              />
              <Button
                onClick={createTag}
                className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Tag
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1A3B47]">Existing Tags</h2>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Edit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delete
                    </th>
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <motion.tbody
                    key="table-body"
                    className="bg-white divide-y divide-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {tags.map((tag, index) => (
                      <motion.tr
                        key={tag._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tag.type}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            onClick={() => {
                              setEditTagId(tag._id);
                              setEditTagName(tag.type);
                            }}
                            className="p-2 bg-white text-[#1A3B47] hover:text-[#1A3B47]/70 hover:underline"
                            size="icon"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            onClick={() => handleDeleteClick(tag)}
                            className="p-2 bg-white text-red-600 hover:text-red-400 hover:underline"
                            size="icon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>
          </div>
        </div>

        <DeleteConfirmation
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          itemType="tag"
          onConfirm={handleConfirmDelete}
        />
        {editTagId && (
          <Dialog open={!!editTagId} onOpenChange={() => setEditTagId(null)}>
            <DialogContent className="sm:max-w-[500px] p-6 bg-white shadow-lg rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-[#1A3B47]">
                  Edit Tag
                </DialogTitle>
              </DialogHeader>
              <Input
                type="text"
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                className="border-[#808080] mb-2"
              />
              <DialogFooter className="flex justify-end space-x-4 mt-2">
                <Button
                  onClick={updateTag}
                  className="bg-[#1A3B47] hover:bg-[#3E5963] text-white px-4 py-2 rounded"
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setEditTagId(null);
                    setEditTagName("");
                  }}
                  className="bg-[#A3A3A3] hover:bg-[#7E7E7E] text-white px-4 py-2 rounded"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <ToastViewport />
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            duration={3000} // Set duration to 3 seconds
            className={toastType === "success" ? "bg-green-100" : "bg-red-100"}
          >
            <div className="flex items-center">
              {toastType === "success" ? (
                <CheckCircle className="text-green-500 mr-2" />
              ) : (
                <XCircle className="text-red-500 mr-2" />
              )}
              <div>
                <ToastTitle>
                  {toastType === "success" ? "Success" : "Error"}
                </ToastTitle>
                <ToastDescription>{toastMessage}</ToastDescription>
              </div>
            </div>
            <ToastClose />
          </Toast>
        )}
      </ToastProvider>
    </div>
  );
}

export default TagsPage;
