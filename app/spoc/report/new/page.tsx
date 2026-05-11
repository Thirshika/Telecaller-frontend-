"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  School,
  BookOpen,
  Building2,
  Megaphone,
  Users,
  Briefcase,
  Share2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Handshake,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

interface InstitutionEntry {
  id: string
  name: string
  contactDetails: string
  nextStep: string
  assignedTo: "Telecaller" | "Me"
  followUpDate: string
}

interface SectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  iconBgColor?: string
  iconColor?: string
}

function Section({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
}: SectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full">
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-4 text-base font-bold text-slate-800">
                <div className={cn("rounded-xl p-2.5", iconBgColor)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                {title}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-6 pt-0">
            <div className="h-px bg-slate-100 mb-6" />
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export default function NewFieldReportPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    schools: false,
    coaching: false,
    admission: false,
    branding: false,
    alumni: false,
    corporate: false,
    referral: false,
    issues: false,
  })

  // Form data
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [areaLocation, setAreaLocation] = useState("")

  // Outreach states
  const [schoolsVisited, setSchoolsVisited] = useState(0)
  const [schoolEntries, setSchoolEntries] = useState<InstitutionEntry[]>([])
  const [coachingVisited, setCoachingVisited] = useState(0)
  const [coachingEntries, setCoachingEntries] = useState<InstitutionEntry[]>([])
  const [admissionVisited, setAdmissionVisited] = useState(0)
  const [admissionEntries, setAdmissionEntries] = useState<InstitutionEntry[]>([])

  // Activities states
  const [brandingDone, setBrandingDone] = useState<string>("No")
  const [brandingNotes, setBrandingNotes] = useState("")
  const [alumniOutreach, setAlumniOutreach] = useState<string>("No")
  const [alumniNotes, setAlumniNotes] = useState("")
  const [corporateOutreach, setCorporateOutreach] = useState<string>("No")
  const [corporateDetails, setCorporateDetails] = useState("")
  const [referralNetwork, setReferralNetwork] = useState<string>("No")
  const [referralNotes, setReferralNotes] = useState("")
  const [challenges, setChallenges] = useState("")
  const [observations, setObservations] = useState("")

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const createEmptyEntry = (): InstitutionEntry => ({
    id: crypto.randomUUID(),
    name: "",
    contactDetails: "",
    nextStep: "",
    assignedTo: "Me",
    followUpDate: "",
  })

  const handleCountChange = (count: number, entries: InstitutionEntry[], setEntries: (e: InstitutionEntry[]) => void) => {
    const currentCount = entries.length
    if (count > currentCount) {
      const newEntries = Array.from({ length: count - currentCount }, () => createEmptyEntry())
      setEntries([...entries, ...newEntries])
    } else if (count < currentCount) {
      setEntries(entries.slice(0, count))
    }
  }

  const updateEntry = (entries: InstitutionEntry[], setEntries: (e: InstitutionEntry[]) => void, id: string, field: keyof InstitutionEntry, value: string) => {
    setEntries(entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))
  }

  const renderInstitutionEntries = (entries: InstitutionEntry[], setEntries: (e: InstitutionEntry[]) => void, label: string) => (
    <div className="space-y-6 mt-6">
      {entries.map((entry, index) => (
        <Card key={entry.id} className="border-2 border-slate-50 bg-slate-50/30 shadow-none overflow-hidden rounded-2xl">
          <CardHeader className="py-3 px-4 bg-slate-100/50">
            <h4 className="font-bold text-slate-700 text-sm">{label} {index + 1}</h4>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">{label} Name</Label>
                <Input 
                  placeholder={`Enter ${label.toLowerCase()} name`} 
                  value={entry.name}
                  onChange={(e) => updateEntry(entries, setEntries, entry.id, "name", e.target.value)}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Contact Details</Label>
                <Input 
                  placeholder="Person Name | Mobile Number" 
                  value={entry.contactDetails}
                  onChange={(e) => updateEntry(entries, setEntries, entry.id, "contactDetails", e.target.value)}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Next Step of Action</Label>
              <Textarea 
                placeholder="Describe what needs to be done next..." 
                value={entry.nextStep}
                onChange={(e) => updateEntry(entries, setEntries, entry.id, "nextStep", e.target.value)}
                className="bg-white border-slate-200 min-h-[80px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Assigned To</Label>
                <Select value={entry.assignedTo} onValueChange={(v) => updateEntry(entries, setEntries, entry.id, "assignedTo", v as any)}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Me">Me (Field Agent)</SelectItem>
                    <SelectItem value="Telecaller">Telecaller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Follow-up Date</Label>
                <Input 
                  type="date" 
                  value={entry.followUpDate}
                  onChange={(e) => updateEntry(entries, setEntries, entry.id, "followUpDate", e.target.value)}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const handleSubmit = () => setShowConfirmDialog(true)

  const confirmSubmit = async () => {
    if (!user) {
      alert("You must be logged in to submit a report.")
      return
    }
    
    setIsSubmitting(true)
    try {
      const report = await api.createFieldReport({
        spocId: user.id,
        reportDate: reportDate,
        areaLocation: areaLocation,
        schoolsVisited: schoolsVisited,
        coachingCentresVisited: coachingVisited,
        admissionCentresVisited: admissionVisited,
        brandingDone: brandingDone === "Yes",
        alumniOutreach: alumniOutreach === "Yes",
        corporateOutreach: corporateOutreach === "Yes",
        referralNetwork: referralNetwork === "Yes",
        isDraft: false
      })

      // Collect all entries
      const allEntries = [...schoolEntries, ...coachingEntries, ...admissionEntries]
      
      // Create follow-up tasks for each entry
      for (const entry of allEntries) {
        if (entry.name && entry.nextStep) {
          await api.createFollowUp({
            sourceReportId: report.id,
            assignedToRole: entry.assignedTo === "Telecaller" ? "Telecaller" : "SPOC",
            assignedToUser: entry.assignedTo === "Me" ? user.id : null, // If 'Me', assign to the SPOC user.id. If 'Telecaller', leave null so it enters the Telecaller pool.
            institutionName: entry.name,
            actionDescription: entry.nextStep,
            followUpDate: entry.followUpDate || new Date().toISOString().split("T")[0],
            status: "Pending",
            createdById: user.id
          })
        }
      }

      router.push("/spoc/dashboard")
    } catch (err) {
      console.error("Failed to submit report:", err)
      alert("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Field Report</h1>
          <p className="text-slate-500 font-medium">Document your field activities for today</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={() => router.push("/spoc/dashboard")} className="border-slate-200 hover:bg-slate-50 font-bold text-slate-700">
            <Save className="h-5 w-5 mr-2" />
            Save Draft
          </Button>
          <Button size="lg" onClick={handleSubmit} className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg">
            <Send className="h-5 w-5 mr-2" />
            Submit Report
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Section A */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-4 text-base font-bold text-slate-800">
              <div className="rounded-xl bg-slate-100 p-2.5">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              Section A - General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="h-px bg-slate-100 mb-6" />
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Date *
                </Label>
                <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white transition-all pl-4" />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Area / Location *
                </Label>
                <Input placeholder="e.g., Poonamallee, Trichy, Pondicherry" value={areaLocation} onChange={(e) => setAreaLocation(e.target.value)} className="h-12 border-slate-200 bg-slate-50/30 focus:bg-white transition-all" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B, C, D */}
        <Section title="Section B - School Outreach" icon={School} isOpen={openSections.schools} onToggle={() => toggleSection("schools")} iconBgColor="bg-blue-50" iconColor="text-blue-500">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">How many schools visited today?</Label>
            <Input type="number" min={0} value={schoolsVisited} onChange={(e) => {
              const val = parseInt(e.target.value) || 0
              setSchoolsVisited(val)
              handleCountChange(val, schoolEntries, setSchoolEntries)
            }} className="w-32 h-12" />
            {schoolsVisited > 0 && renderInstitutionEntries(schoolEntries, setSchoolEntries, "School")}
          </div>
        </Section>

        <Section title="Section C - Coaching Centre Outreach" icon={BookOpen} isOpen={openSections.coaching} onToggle={() => toggleSection("coaching")} iconBgColor="bg-purple-50" iconColor="text-purple-500">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">How many coaching centres visited today?</Label>
            <Input type="number" min={0} value={coachingVisited} onChange={(e) => {
              const val = parseInt(e.target.value) || 0
              setCoachingVisited(val)
              handleCountChange(val, coachingEntries, setCoachingEntries)
            }} className="w-32 h-12" />
            {coachingVisited > 0 && renderInstitutionEntries(coachingEntries, setCoachingEntries, "Coaching Centre")}
          </div>
        </Section>

        <Section title="Section D - Admission Centre Partnership" icon={Handshake} isOpen={openSections.admission} onToggle={() => toggleSection("admission")} iconBgColor="bg-emerald-50" iconColor="text-emerald-500">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">How many admission centres visited today?</Label>
            <Input type="number" min={0} value={admissionVisited} onChange={(e) => {
              const val = parseInt(e.target.value) || 0
              setAdmissionVisited(val)
              handleCountChange(val, admissionEntries, setAdmissionEntries)
            }} className="w-32 h-12" />
            {admissionVisited > 0 && renderInstitutionEntries(admissionEntries, setAdmissionEntries, "Admission Centre")}
          </div>
        </Section>

        {/* Section E, F, G, H, I */}
        <Section title="Section E - Local Branding Activities" icon={Megaphone} isOpen={openSections.branding} onToggle={() => toggleSection("branding")} iconBgColor="bg-orange-50" iconColor="text-orange-500">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">Have you distributed posters/banners/pamphlets today?</Label>
            <RadioGroup value={brandingDone} onValueChange={setBrandingDone} className="flex gap-6">
              {["Yes", "No"].map(v => (
                <div key={v} className="flex items-center space-x-2">
                  <RadioGroupItem value={v} id={`branding-${v}`} />
                  <Label htmlFor={`branding-${v}`} className="font-medium">{v}</Label>
                </div>
              ))}
            </RadioGroup>
            {brandingDone === "Yes" && <Textarea placeholder="Locations, quantity, type of materials..." value={brandingNotes} onChange={(e) => setBrandingNotes(e.target.value)} className="mt-4 min-h-[100px]" />}
          </div>
        </Section>

        <Section title="Section F - Alumni Networking" icon={Users} isOpen={openSections.alumni} onToggle={() => toggleSection("alumni")} iconBgColor="bg-teal-50" iconColor="text-teal-500">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">Have you reached out through alumni network today?</Label>
            <RadioGroup value={alumniOutreach} onValueChange={setAlumniOutreach} className="flex gap-6">
              {["Yes", "No"].map(v => (
                <div key={v} className="flex items-center space-x-2">
                  <RadioGroupItem value={v} id={`alumni-${v}`} />
                  <Label htmlFor={`alumni-${v}`} className="font-medium">{v}</Label>
                </div>
              ))}
            </RadioGroup>
            {alumniOutreach === "Yes" && <Textarea placeholder="Alumni names, leads referred..." value={alumniNotes} onChange={(e) => setAlumniNotes(e.target.value)} className="mt-4 min-h-[100px]" />}
          </div>
        </Section>

        <Section title="Section G - Corporate Outreach" icon={Briefcase} isOpen={openSections.corporate} onToggle={() => toggleSection("corporate")} iconBgColor="bg-indigo-50" iconColor="text-indigo-500">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">Have you reached out to corporate companies or local businesses?</Label>
            <RadioGroup value={corporateOutreach} onValueChange={setCorporateOutreach} className="flex gap-6">
              {["Yes", "No"].map(v => (
                <div key={v} className="flex items-center space-x-2">
                  <RadioGroupItem value={v} id={`corporate-${v}`} />
                  <Label htmlFor={`corporate-${v}`} className="font-medium">{v}</Label>
                </div>
              ))}
            </RadioGroup>
            {corporateOutreach === "Yes" && <Textarea placeholder="Company details, contact person, outcome..." value={corporateDetails} onChange={(e) => setCorporateDetails(e.target.value)} className="mt-4 min-h-[100px]" />}
          </div>
        </Section>

        <Section title="Section H - Referral Networking" icon={Share2} isOpen={openSections.referral} onToggle={() => toggleSection("referral")} iconBgColor="bg-pink-50" iconColor="text-pink-500">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">Have you built or expanded your referral network today?</Label>
            <RadioGroup value={referralNetwork} onValueChange={setReferralNetwork} className="flex gap-6">
              {["Yes", "No"].map(v => (
                <div key={v} className="flex items-center space-x-2">
                  <RadioGroupItem value={v} id={`referral-${v}`} />
                  <Label htmlFor={`referral-${v}`} className="font-medium">{v}</Label>
                </div>
              ))}
            </RadioGroup>
            {referralNetwork === "Yes" && <Textarea placeholder="Who referred, student names, courses..." value={referralNotes} onChange={(e) => setReferralNotes(e.target.value)} className="mt-4 min-h-[100px]" />}
          </div>
        </Section>

        <Section title="Section I - Issues & Observations" icon={AlertCircle} isOpen={openSections.issues} onToggle={() => toggleSection("issues")} iconBgColor="bg-red-50" iconColor="text-red-500">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Challenges / Objections / Issues to Escalate</Label>
              <Textarea placeholder="Response rates, competition, objections faced..." value={challenges} onChange={(e) => setChallenges(e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Other Observations / Suggestions</Label>
              <Textarea placeholder="Any other observations or suggestions..." value={observations} onChange={(e) => setObservations(e.target.value)} className="min-h-[100px]" />
            </div>
          </div>
        </Section>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6">
        <Button variant="ghost" onClick={() => router.push("/spoc/dashboard")} className="font-bold text-slate-500">Cancel</Button>
        <Button size="lg" onClick={handleSubmit} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-10 h-14 shadow-xl">
          <Send className="h-5 w-5 mr-2" />
          Submit Final Report
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Submit Field Report?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-base mt-2">
              Once submitted, you will not be able to edit this report. All follow-up tasks assigned to Telecallers will be automatically created in their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8">
            <AlertDialogCancel className="border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl h-12 px-8">
              {isSubmitting ? "Submitting..." : "Yes, Submit Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
