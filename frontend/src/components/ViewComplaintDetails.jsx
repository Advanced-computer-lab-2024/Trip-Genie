import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  Flag,
  Mail,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";

export const ViewComplaintDetails = ({ complaintId, onBack }) => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchComplaintDetails = async () => {
    try {
      const token = Cookies.get("jwt");
      let role = Cookies.get("role") || "guest";
      const api = `https://trip-genie-apis.vercel.app/${role}/complaint/${complaintId}`;
      const response = await axios.get(api, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaint(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaintId]);

  const handleReply = async () => {
    try {
      const token = Cookies.get("jwt");
      if (!replyContent.trim()) {
        console.error("Reply content is empty.");
        return;
      }
      await axios.post(
        `https://trip-genie-apis.vercel.app/admin/complaint/${complaintId}/reply`,
        { content: replyContent },
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReplyContent("");
      await fetchComplaintDetails();
    } catch (error) {
      console.error(
        "Failed to add reply",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = Cookies.get("jwt");
      await axios.put(
        `https://trip-genie-apis.vercel.app/admin/complaint/${complaintId}/status`,
        { status: newStatus },
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchComplaintDetails();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-[#5D9297] text-white";
      case "pending":
        return "bg-[#F88C33] text-white";
      case "new":
        return "bg-[#388A94] text-white";
      default:
        return "bg-[#E6DCCF] text-[#1A3B47]";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#5D9297]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-[#F88C33]">
        <AlertCircle className="w-8 h-8 mr-2" />
        Error: {error}
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex items-center justify-center h-screen text-[#5D9297]">
        <AlertCircle className="w-8 h-8 mr-2" />
        Complaint not found
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="">
        <Button
          onClick={onBack}
          className="mb-3 bg-[#5D9297] text-white text-sm flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Complaints
        </Button>
        <Card className="max-w-[1200px] mx-auto p-4 shadow-xl rounded-lg bg-white border border-[#B5D3D1]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-[#1A3B47] mb-1 leading-tight">
                    {complaint.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-xs text-[#5D9297]">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(complaint.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <bottun
                  variant="secondary"
                  className={`${getStatusBadgeVariant(complaint.status)} 
                  text-xs py-1 px-2 rounded-md font-semibold whitespace-nowrap mt-2 md:mt-0`}
                >
                  {complaint.status}
                </bottun>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border border-[#B5D3D1]">
                <div className="prose prose-sm max-w-none">
                  <p className="text-[#1A3B47] text-sm leading-relaxed whitespace-pre-wrap">
                    {complaint.body}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#1A3B47] flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Replies
                </h3>
                <ScrollArea className="h-[200px] pr-4">
                  {complaint.replies.length ? (
                    complaint.replies.map((reply, index) => (
                      <div
                        key={index}
                        className="p-3 bg-[#E6DCCF] bg-opacity-30 rounded-lg shadow-sm border border-[#B5D3D1] 
                        hover:shadow-md transition-shadow duration-200 mb-2"
                      >
                        <p className="text-[#1A3B47] text-sm mb-1">
                          {reply.content}
                        </p>
                        <span className="text-xs text-[#5D9297] flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#5D9297] italic text-sm p-3">
                      No replies yet
                    </p>
                  )}
                </ScrollArea>
              </div>

              <div className="relative">
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[100px] text-sm focus:ring-2 focus:ring-[#5D9297] border-[#B5D3D1] pr-10"
                />
                <button
                  onClick={handleReply}
                  className={`absolute right-2 bottom-2 p-2 rounded-full text-white 
                  focus:outline-none focus:ring-2 focus:ring-[#1A3B47] transition-colors duration-200
                  ${
                    replyContent.trim()
                      ? "bg-[#1A3B47] hover:bg-[#388A94]"
                      : "bg-[#B5D3D1] cursor-not-allowed"
                  }`}
                  disabled={!replyContent.trim()}
                >
                  <Send className="w-4 h-4" />
                  <span className="sr-only">Send reply</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-3 bg-white shadow-md rounded-lg border border-[#B5D3D1]">
                <CardHeader className="px-0 pt-0 pb-2">
                  <CardTitle className="text-base font-semibold text-[#1A3B47] border-b border-[#B5D3D1] pb-2">
                    Tourist Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-2 space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-[#5D9297]" />
                    <span className="text-[#1A3B47] text-sm">
                      {complaint.tourist.username}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-[#5D9297]" />
                    <span className="text-[#1A3B47] text-sm">
                      {complaint.tourist.email}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-[#5D9297]" />
                    <span className="text-[#1A3B47] text-sm">
                      {complaint.tourist.mobile}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Flag className="w-4 h-4 mr-2 text-[#5D9297]" />
                    <span className="text-[#1A3B47] text-sm">
                      {complaint.tourist.nationality.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-[#5D9297]" />
                    <span className="text-[#1A3B47] text-sm">
                      {new Date(
                        complaint.tourist.dateOfBirth
                      ).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-[#5D9297]" />
                    <span className="text-[#1A3B47] text-sm">
                      {complaint.tourist.jobOrStudent}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-3 bg-white shadow-md rounded-lg border border-[#B5D3D1]">
                <CardHeader className="px-0 pt-0 pb-2">
                  <CardTitle className="text-base font-semibold text-[#1A3B47] border-b border-[#B5D3D1] pb-2">
                    Update Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-2 space-y-2">
                  <Button
                    onClick={() => handleStatusChange("pending")}
                    className="bg-[#F88C33] hover:bg-[#E67D22] active:bg-[#D56F1A] active:transform active:scale-95 
                    text-white transition-all duration-200 w-full text-sm"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Mark as Pending
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("resolved")}
                    className="bg-[#5D9297] hover:bg-[#388A94] active:bg-[#1A3B47] active:transform active:scale-95 
                    text-white transition-all duration-200 w-full text-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
