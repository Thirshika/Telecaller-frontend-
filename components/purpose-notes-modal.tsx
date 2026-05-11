"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface PurposeNotesModalProps {
  isOpen: boolean
  onClose: () => void
  prospect: any
  purpose: string
  onSave: (notes: string) => void
}

export function PurposeNotesModal({ isOpen, onClose, prospect, purpose, onSave }: PurposeNotesModalProps) {
  const [notes, setNotes] = useState("")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Description for <span className="text-blue-600">{prospect?.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Label className="text-slate-500 font-medium">Updating Purpose to:</Label>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none">
              {purpose}
            </Badge>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes" className="font-bold">Detailed Call Description</Label>
            <Textarea
              id="notes"
              placeholder="What happened during this call? Write the details here..."
              className="min-h-[120px] rounded-xl focus:ring-blue-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button 
            onClick={() => {
              onSave(notes);
              setNotes("");
            }} 
            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
            disabled={!notes.trim()}
          >
            Submit & Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
