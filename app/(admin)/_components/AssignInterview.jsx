"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/superbaseClient";
import { toast } from "sonner";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

const AssignInterview = ({ goToPrevious, interviewId }) => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUSNs, setSelectedUSNs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("Users").select("USN");
      if (error) {
        toast.error("Failed to fetch users");
        console.error(error);
      } else {
        setUsers(data || []);
      }
    };
    fetchUsers();
  }, []);

  const toggleUSN = (usn) => {
    setSelectedUSNs((prev) =>
      prev.includes(usn) ? prev.filter((u) => u !== usn) : [...prev, usn]
    );
  };

  const assignCandidates = async () => {
    if (!selectedUSNs.length)
      return toast.error("Select at least one candidate");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interview_candidates")
        .insert(
          selectedUSNs.map((usn) => ({
            USN: usn,
            interviewid: interviewId,
          }))
        );

      if (error) throw error;
      toast.success("Candidates assigned successfully");
      router.push("/admin-dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign candidates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        <h2 className="font-bold text-lg">Assign Candidates</h2>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full text-left">
              {selectedUSNs.length
                ? selectedUSNs.join(", ")
                : "Select Candidates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search candidates..." />
              <CommandEmpty>No candidates found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.USN}
                    onSelect={() => toggleUSN(user.USN)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUSNs.includes(user.USN)}
                      readOnly
                      className="mr-2"
                    />
                    {user.USN}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex justify-between mt-2">
          <Button onClick={goToPrevious}>Prev</Button>
          <Button onClick={assignCandidates} disabled={loading}>
            {loading ? "Assigning..." : "Assign Candidates"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignInterview;
