"use client"

import { useState } from "react"
import { Calendar, Clock, MessageSquare, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Prospect } from "@/lib/mock-data"

interface ScheduleCallModalProps {
  prospect: Prospect | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    nextCallDate: string
    nextCallTime: string
    remarks: string
    followupStatus: string
  }) => void
}

export function ScheduleCallModal({
  prospect,
  open,
  onOpenChange,
  onSave,
}: ScheduleCallModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState("")
  const [note, setNote] = useState("")
  const [followupType, setFollowupType] = useState("Call Back")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!date || !time) return
    setIsSaving(true)
    try {
      await onSave({
        nextCallDate: date,
        nextCallTime: time,
        remarks: note,
        followupStatus: followupType,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Schedule Call
          </DialogTitle>
          <DialogDescription>
            Set a reminder to call {prospect?.name} later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Time
            </Label>
            <div className="flex gap-2">
              <Select 
                value={time.split(':')[0] ? (parseInt(time.split(':')[0]) % 12 || 12).toString().padStart(2, '0') : "09"} 
                onValueChange={(h) => {
                  const m = time.split(':')[1] || "00";
                  const isPM = parseInt(time.split(':')[0] || "09") >= 12;
                  let h24 = parseInt(h);
                  if (isPM && h24 < 12) h24 += 12;
                  if (!isPM && h24 === 12) h24 = 0;
                  setTime(`${h24.toString().padStart(2, '0')}:${m}`);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Hr" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={time.split(':')[1] || "00"} 
                onValueChange={(m) => {
                  const h = time.split(':')[0] || "09";
                  setTime(`${h}:${m}`);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={parseInt(time.split(':')[0] || "09") >= 12 ? "PM" : "AM"} 
                onValueChange={(ampm) => {
                  let h = parseInt(time.split(':')[0] || "09") % 12;
                  if (ampm === "PM") h += 12;
                  const m = time.split(':')[1] || "00";
                  setTime(`${h.toString().padStart(2, '0')}:${m}`);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="followup" className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              Follow-up Type
            </Label>
            <Select value={followupType} onValueChange={setFollowupType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Call Back">Call Back</SelectItem>
                <SelectItem value="Interested Later">Interested Later</SelectItem>
                <SelectItem value="Not Reachable">Not Reachable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Note (Optional)
            </Label>
            <Textarea
              id="note"
              placeholder="e.g. Student busy, Call after 6 PM"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!date || !time || isSaving}>
            {isSaving ? "Saving..." : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
