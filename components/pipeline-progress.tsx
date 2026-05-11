import { cn } from "@/lib/utils"
import { type ProspectStatus } from "@/lib/mock-data"
import { 
  UserPlus, 
  Phone, 
  Sun, 
  Zap, 
  Calendar, 
  Home, 
  Award, 
  XSquare,
  CloudRain,
  XCircle,
  ChevronRight,
  RefreshCw,
  Check
} from "lucide-react"

interface Stage {
  id: ProspectStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

const mainStages = [
  { id: "New", label: "New", icon: UserPlus, color: "#a2d2df", description: "Lead just entered the system" },
  { id: "Contacted", label: "Contacted", icon: Phone, color: "#bcd2ee", description: "Initial contact made via call/message" },
  { id: "Warm", label: "Warm", icon: Sun, color: "#fdfd96", description: "Interested & needs regular follow-up" },
  { id: "Hot", label: "Hot", icon: Zap, color: "#ffccb6", description: "Strong interest & ready for visit" },
  { id: "VisitScheduled", label: "Visit Scheduled", icon: Calendar, color: "#e0bbe4", description: "College visit planned and confirmed" },
  { id: "VisitDone", label: "Visit Done", icon: Home, color: "#e0bbe4", description: "Visited campus, decision pending" },
  { id: "AdmissionDone", label: "Admission Done", icon: Award, color: "#b2f2bb", description: "Successfully admitted to course" },
]

const exitStages = [
  { id: "not_interested", label: "Not Interested", icon: XSquare, color: "#e2e8f0", description: "Prospect explicitly rejected" },
  { id: "invalid", label: "Invalid Number", icon: XCircle, color: "#fecaca", description: "Phone number is incorrect" },
  { id: "dnc", label: "Do Not Call", icon: CloudRain, color: "#e2e8f0", description: "Requested no further contact" },
]

// Map the new status strings to the journey stages
function getJourneyStage(status: string): string {
  const map: Record<string, string> = {
    "not_answered": "Contacted",
    "busy": "Contacted",
    "callback": "Contacted",
    "language_issue": "Contacted",
    "interested": "Warm",
    "qualified": "Hot",
    "visit_scheduled": "Visit Scheduled",
    "visit_done": "Visit Done",
    "admission_done": "Admission Done",
  }
  return map[status] || status
}

interface PipelineProgressProps {
  currentStatus: string
  className?: string
}

export function PipelineProgress({ currentStatus, className }: PipelineProgressProps) {
  const effectiveStage = getJourneyStage(currentStatus)
  const currentStageIndex = mainStages.findIndex(s => s.label === effectiveStage || s.id === effectiveStage)
  const isExitStage = exitStages.some(s => s.id === currentStatus || s.label === currentStatus)
  const currentExitStage = exitStages.find(s => s.id === currentStatus || s.label === currentStatus)

  return (
    <div className={cn("bg-slate-50/50 rounded-xl border p-5 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="h-3 w-3" />
          Lead Journey
        </h3>
        {isExitStage && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
            Inactive Stage
          </span>
        )}
      </div>

      <div className="space-y-3">
        {mainStages.map((stage, index) => {
          const isActive = stage.label === effectiveStage || stage.id === effectiveStage
          const isCompleted = currentStageIndex > index && !isExitStage
          const isUpcoming = currentStageIndex < index || isExitStage

          return (
            <div key={stage.id} className="relative">
              {/* Connector Line */}
              {index < mainStages.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-4 top-8 w-0.5 h-6 transition-colors duration-500",
                    isCompleted ? "bg-green-400" : "bg-slate-200"
                  )}
                />
              )}

              <div className={cn(
                "flex items-center gap-4 transition-all duration-300",
                isActive ? "opacity-100 scale-[1.02]" : "opacity-60"
              )}>
                {/* Icon Circle */}
                <div 
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                    isActive ? "border-slate-900 shadow-md" : 
                    isCompleted ? "bg-green-500 border-green-500" : "bg-white border-slate-200"
                  )}
                  style={{ backgroundColor: isActive ? stage.color : undefined }}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <stage.icon className={cn("h-4 w-4", isActive ? "text-slate-900" : "text-slate-400")} />
                  )}
                </div>

                {/* Text Content */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-bold",
                      isActive ? "text-slate-900" : "text-slate-500"
                    )}>
                      {stage.label}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-medium text-slate-400 italic">Current Stage</span>
                    )}
                  </div>
                  {isActive && (
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {stage.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isExitStage && currentExitStage && (
        <div className="mt-6 pt-4 border-t border-dashed border-slate-300">
          <div className="flex items-center gap-4 p-3 rounded-lg bg-white border-2 border-red-100 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <currentExitStage.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600">Leads Dropped Off</p>
              <p className="text-sm font-bold text-slate-800">{currentExitStage.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentExitStage.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Tip based on flowchart ideas */}
      {!isExitStage && currentStageIndex !== -1 && currentStageIndex < mainStages.length - 1 && (
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2">
          <div className="mt-0.5 h-3 w-3 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="h-1 w-1 rounded-full bg-primary" />
          </div>
          <p className="text-[10px] text-primary font-medium leading-relaxed">
            <strong>Next Step:</strong> {mainStages[currentStageIndex + 1].label}. 
            Follow the criteria to qualify the lead for the next stage.
          </p>
        </div>
      )}
    </div>
  )
}
