"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Phone, User, MessageSquare } from "lucide-react"
import { api } from "@/lib/api"
import { format } from "date-fns"

interface CallLog {
  id: string
  outcome: string
  notes: string
  calledAt: string
  telecallerName?: string
}

interface CallHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  prospect: any
}

export function CallHistoryModal({ isOpen, onClose, prospect }: CallHistoryModalProps) {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && prospect?.id) {
      loadLogs()
    }
  }, [isOpen, prospect?.id])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await api.getProspectCallLogs(prospect.id)
      setLogs(data)
    } catch (err) {
      console.error("Failed to load call logs:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
        <DialogHeader className="p-6 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">{prospect?.name}</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Call History & Descriptions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium animate-pulse">
                Loading history...
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-6">
                {logs.map((log, index) => (
                  <div key={log.id} className="relative pl-8 pb-2">
                    {/* Timeline line */}
                    {index !== logs.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-200" />
                    )}
                    
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10 shadow-sm">
                      <Phone className="h-3 w-3 text-blue-500" />
                    </div>

                    <div className="space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-bold text-[10px] uppercase tracking-wider">
                          {log.outcome}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.calledAt), "dd MMM, hh:mm a")}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 mt-2">
                        <MessageSquare className="h-4 w-4 text-slate-300 mt-1 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {log.notes || "No description provided."}
                          </p>
                          {log.telecallerName && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Called by: {log.telecallerName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">No History Yet</h4>
                  <p className="text-sm text-slate-500 max-w-[200px]">
                    No call logs have been recorded for this student yet.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
