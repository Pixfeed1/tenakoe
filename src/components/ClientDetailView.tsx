"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail, MessageSquare, Phone, Building2, FileText, FolderOpen,
  ClipboardList, RefreshCw, ChevronRight, X, Send, Upload, Check,
  Calendar, UserCircle, Zap, StickyNote, Pin, Trash2, Edit3, Plus, Download, Paperclip, Handshake, CheckCircle, XCircle, Circle, Clock,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { DocCheck, TrackStep } from "@/lib/data";
import { GuideTooltip, useGuide } from "@/components/GuideSystem";
import { isDemo as checkIsDemo, DEMO_ENTREPRISE, DEMO_CONTACTS, DEMO_DOCUMENTS, DEMO_ETAPES, DEMO_HISTORIQUE, DEMO_NOTES, DEMO_PROJETS, DEMO_TACHES, DEMO_TRANSMISSIONS, DEMO_MAIL_TEMPLATES, demoBadgeStyle, handleDemoAction } from "@/lib/demo";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { formatPhone, formatContactName, hydrateTemplate, fixFileUrl } from "@/lib/format";
import { TransmissionDetailModal } from "@/components/TransmissionDetailModal";

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  EMAIL: Mail, SMS: MessageSquare, DOC: FileText, STATUT: RefreshCw, LEAD: Zap,
  APPEL: Phone, TELEPHONE: Phone, NOTE: FileText, TACHE: ClipboardList,
};
const ACTIVITY_COLORS: Record<string, string> = {
  EMAIL: "blue", SMS: "purple", DOC: "accent", STATUT: "warning", LEAD: "blue",
  APPEL: "accent", TELEPHONE: "accent", NOTE: "purple", TACHE: "warning",
};

interface ClientDetailViewProps {
  C: Theme;
  client: { id?: string; nom: string; siret?: string; prescripteur?: string; isDemo?: boolean } | null;
  onBack: () => void;
}

export function ClientDetailView({ C, client, onBack }: ClientDetailViewProps) {
  const guide = useGuide();
  const { toast } = useToast();
  const isDemoMode = client?.isDemo || checkIsDemo(client || {});
  const [docs, setDocs] = useState<(DocCheck & { id?: string })[]>([]);
  const [tracks, setTracks] = useState<TrackStep[]>([]);
  const [entrepriseData, setEntrepriseData] = useState<Record<string, string> | null>(null);
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailCc, setMailCc] = useState("");
  const [mailBcc, setMailBcc] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsBody, setSmsBody] = useState("");
  const [notes, setNotes] = useState<Array<{
    id: string; contenu: string; epinglee: boolean; createdAt: string;
    auteur: { id: string; prenom: string; nom: string };
    fichierUrl?: string | null; fichierNom?: string | null; fichierTaille?: number | null;
  }>>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [nonConformeDocId, setNonConformeDocId] = useState<string | null>(null);
  const [nonConformeMotif, setNonConformeMotif] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mailTemplates, setMailTemplates] = useState<Array<{ id: string; nom: string; objet: string; contenu: string; categorie: string | null }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; nom: string; prenom: string; email: string | null; telephone: string | null; fonction: string | null }>>([]);
  const [taches, setTaches] = useState<Array<{ id: string; titre: string; statut: string; type: string; dateEcheance: string | null; enRetard: boolean; assignee?: { id: string; prenom: string; nom: string } | null }>>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ nom: "", prenom: "", email: "", telephone: "", fonction: "" });
  const [showAddTache, setShowAddTache] = useState(false);
  const [showAddProjet, setShowAddProjet] = useState(false);
  const [newProjetForm, setNewProjetForm] = useState<{ nom: string; qualifications: Array<{ code: string; nom: string }>; chargeeId: string }>({ nom: "", qualifications: [], chargeeId: "" });
  const [qualifSearch, setQualifSearch] = useState("");
  const [qualifResults, setQualifResults] = useState<Array<{ code: string; nom: string; categorie: string }>>([]);
  const [nomenclatureMap, setNomenclatureMap] = useState<Record<string, string>>({});
  interface BonDeCommande { id: string; qualificationCode: string; reference: string | null; montant: number | null; paye: boolean; datePaiement: string | null; dateEmission: string | null; commentaire: string | null }
  interface ChantierDoc { id: string; nom: string; fichierUrl: string | null; fichierNom: string | null; fichierTaille: number | null }
  interface ChantierData { id: string; numero: number; nom: string | null; description: string | null; devisRecu: boolean; devisFichierUrl: string | null; devisFichierNom: string | null; dateDevis: string | null; factureRecue: boolean; factureFichierUrl: string | null; factureFichierNom: string | null; dateFacture: string | null; attestationRecue: boolean; attestationFichierUrl: string | null; attestationFichierNom: string | null; dateAttestation: string | null; documents: ChantierDoc[] }
  const [projets, setProjets] = useState<Array<{ id: string; nom: string; qualifications: Array<{ id?: string; type: string; niveauVise?: string | null; niveauObtenu?: string | null; rges?: Array<{ id: string; rgeCode: string }> }>; etapes: Array<{ terminee: boolean; active: boolean; nom: string }>; bonsDeCommande?: BonDeCommande[]; chantiers?: ChantierData[]; antenneQualibatId?: string | null; interlocuteurQualibat?: string | null; dateCommission?: string | null; identifiantQualibat?: string | null; motDePasseQualibat?: string | null; certificateurType?: string | null; emailCertificateur?: string | null; bonCommandeDemande?: boolean; dateBonCommandeDemande?: string | null; bonCommandePaye?: boolean; dateBonCommandePaye?: string | null }>>([]);
  const [nomenclatureRGE, setNomenclatureRGE] = useState<Array<{ code: string; nom: string }>>([]);
  const [showAddBon, setShowAddBon] = useState<string | null>(null);
  const [newBonForm, setNewBonForm] = useState({ qualificationCode: "", reference: "", montant: "", dateEmission: "" });
  const [antennes, setAntennes] = useState<Array<{ id: string; nom: string; email: string | null; telephone: string | null; delegation: string | null }>>([]);
  const [newTache, setNewTache] = useState<{ titre: string; type: string; dateEcheance: string; assigneeId: string }>({ titre: "", type: "AUTRE", dateEcheance: "", assigneeId: "" });
  const [historique, setHistorique] = useState<Array<{ id?: string; type: string; message: string; chargee: string; time: string; automatique?: boolean; statutEnvoi?: string | null }>>([]);
  const [viewingTransmissionId, setViewingTransmissionId] = useState<string | null>(null);
  const [showCallLog, setShowCallLog] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContact, setEditContact] = useState({ nom: "", prenom: "", email: "", telephone: "", fonction: "" });
  const [callNote, setCallNote] = useState("");
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});
  const [depotConfigs, setDepotConfigs] = useState<Array<{ id: string; nom: string }>>([]);
  const [apporteurs, setApporteurs] = useState<Array<{ id: string; nom: string; prenom: string | null; structure: string | null }>>([]);
  const [mentionUsers, setMentionUsers] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [noteFile, setNoteFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!client?.id) return;
    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entrepriseId", client.id);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUploadMsg({ type: "success", msg: `${data.nom} uploadé` });
        toast("Fichier uploadé");
        // Refresh docs list
        if (client?.id) {
          fetch(`/api/documents?entrepriseId=${client.id}`)
            .then((r) => r.ok ? r.json() : [])
            .then((freshDocs) => setDocs(freshDocs.map((d: { id: string; nom: string; recu: boolean; dateReception: string | null; type?: string; qualificationAssociee?: string | null; conformite?: string | null; notes?: string | null; fichierUrl?: string | null; fichierNom?: string | null }) => ({
              id: d.id, nom: d.nom, recu: d.recu, type: d.type || "TRONC_COMMUN", qualificationAssociee: d.qualificationAssociee || null,
              conformite: d.conformite || null, notes: d.notes || null,
              date: d.dateReception ? new Date(d.dateReception).toLocaleDateString("fr-FR") : null, fichierUrl: d.fichierUrl || null, fichierNom: d.fichierNom || null,
            }))))
            .catch(() => {});
        }
      } else {
        const err = await res.json();
        setUploadMsg({ type: "error", msg: err.error || "Erreur d'upload" });
      }
    } catch {
      setUploadMsg({ type: "error", msg: "Erreur réseau" });
    }
    setUploading(false);
  };

  // Initialize demo data
  useEffect(() => {
    if (!isDemoMode) return;
    const firstContact = DEMO_CONTACTS[0];
    const firstProjet = DEMO_PROJETS[0];
    const firstQualif = firstProjet?.qualifications[0];
    setEntrepriseData({
      nom: DEMO_ENTREPRISE.nom,
      siret: DEMO_ENTREPRISE.siret,
      email: DEMO_ENTREPRISE.email,
      telephone: DEMO_ENTREPRISE.telephone,
      adresse: DEMO_ENTREPRISE.adresse,
      prescripteur: DEMO_ENTREPRISE.prescripteur,
      contact: `${firstContact.prenom} ${firstContact.nom}`,
      statutPrise: DEMO_ENTREPRISE.statutPrise,
      interesseTNK: DEMO_ENTREPRISE.interesseTNK,
      statutFacturation: DEMO_ENTREPRISE.statutFacturation,
      miseEnRelation: DEMO_ENTREPRISE.miseEnRelation,
      miseEnRelationAutre: DEMO_ENTREPRISE.miseEnRelationAutre || "",
      formationsCommentaire: DEMO_ENTREPRISE.formationsCommentaire || "",
      alerte1Envoyee: DEMO_ENTREPRISE.alerte1Envoyee ? "true" : "false",
      dateAlerte1: DEMO_ENTREPRISE.dateAlerte1 || "",
      alerte2Envoyee: DEMO_ENTREPRISE.alerte2Envoyee ? "true" : "false",
      dateAlerte2: DEMO_ENTREPRISE.dateAlerte2 || "",
      mailAbandonEnvoye: DEMO_ENTREPRISE.mailAbandonEnvoye ? "true" : "false",
      dateMailAbandon: DEMO_ENTREPRISE.dateMailAbandon || "",
      depotId: DEMO_ENTREPRISE.depotId || "",
      depotNom: DEMO_ENTREPRISE.depotConfig?.nom || "",
      apporteurId: DEMO_ENTREPRISE.apporteurId || "",
      apporteurNom: DEMO_ENTREPRISE.apporteur ? `${DEMO_ENTREPRISE.apporteur.nom}${DEMO_ENTREPRISE.apporteur.structure ? " (" + DEMO_ENTREPRISE.apporteur.structure + ")" : ""}` : "",
      numeroCarte: DEMO_ENTREPRISE.numeroCarte,
      qualification: firstQualif ? "Qualibat RGE" : "",
      qualificationId: "",
      formation: firstQualif?.formationITI ? "ITI" : "",
      formationITI: firstQualif?.formationITI ? "true" : "false",
      formationITE: firstQualif?.formationITE ? "true" : "false",
      formationMenuiserie: firstQualif?.formationMenuiserie ? "true" : "false",
      formationQUALIPAC: firstQualif?.formationQUALIPAC ? "true" : "false",
      formationTR: "false", formationMenuiserieExt: "false", formationVMC: "false",
      formationToituresVelux: "false", formationToituresTerrasses: "false",
      formationEmetteursElec: "false", formationChaudiereCogen: "false", formationBT: "false",
      formationHorsRenoperfITI: "false", formationHorsRenoperfITE: "false",
      chargee: firstProjet?.chargee?.prenom || "Kelly",
      dateStatutPrise: DEMO_ENTREPRISE.dateStatutPrise || "",
      dateStatutFacturation: DEMO_ENTREPRISE.dateStatutFacturation || "",
      dateInteresseTNK: DEMO_ENTREPRISE.dateInteresseTNK || "",
      dateMiseEnRelation: DEMO_ENTREPRISE.dateMiseEnRelation || "",
      dateQualification: DEMO_ENTREPRISE.dateQualification || "",
    });
    setDocs(DEMO_DOCUMENTS.map((d) => ({ id: d.id, nom: d.nom, recu: d.recu, date: d.date })));
    setTracks(DEMO_ETAPES.map((e) => ({ id: e.id, nom: e.nom, delai: e.delai, done: e.done, active: e.active })));
    setContacts(DEMO_CONTACTS.map((c) => ({ id: c.id, nom: c.nom, prenom: c.prenom, email: c.email, telephone: c.telephone, fonction: c.fonction })));
    setProjets(DEMO_PROJETS.map((p) => ({ id: p.id, nom: p.nom, qualifications: p.qualifications.map((q) => ({ type: q.type })), etapes: p.etapes.map((e) => ({ terminee: e.terminee, active: e.active, nom: e.nom })), antenneQualibatId: p.antenneQualibatId, interlocuteurQualibat: p.interlocuteurQualibat, dateCommission: p.dateCommission, identifiantQualibat: p.identifiantQualibat, motDePasseQualibat: p.motDePasseQualibat })));
    setTaches(DEMO_TACHES.map((t) => ({ id: t.id, titre: t.titre, statut: t.statut, type: t.type, dateEcheance: t.dateEcheance, enRetard: t.enRetard, assignee: t.assignee })));
    setHistorique(DEMO_TRANSMISSIONS.map((t) => ({
      type: t.canal === "EMAIL" ? "EMAIL" : t.canal === "SMS" ? "SMS" : "APPEL",
      message: `${t.canal === "EMAIL" ? "Mail" : t.canal === "SMS" ? "SMS" : "Appel"} ${t.direction === "SORTANT" ? "envoyé" : "reçu"} — ${t.objet || t.destinataire}`,
      chargee: t.expediteur ? `${t.expediteur.prenom}` : "—",
      time: formatRelativeTime(new Date(t.dateEnvoi)),
    })));
    setNotes(DEMO_NOTES.map((n) => ({ id: n.id, contenu: n.contenu, epinglee: n.epinglee, createdAt: n.createdAt, auteur: n.auteur })));
    setMailTemplates(DEMO_MAIL_TEMPLATES);
  }, [isDemoMode]);

  // Track fiche opened for guide progression
  useEffect(() => {
    if (client?.id && !isDemoMode) {
      fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aOuvertFiche" }) }).catch(() => {});
    }
  }, [client?.id, isDemoMode]);

  // Fetch real data if client has an ID
  useEffect(() => {
    if (!client?.id || isDemoMode) return;

    fetch(`/api/entreprises/${client.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;

        // Load real documents
        if (data.documents?.length > 0) {
          setDocs(
            data.documents.map((d: { id: string; nom: string; recu: boolean; dateReception: string | null; type?: string; qualificationAssociee?: string | null; conformite?: string | null; notes?: string | null; fichierUrl: string | null; fichierNom: string | null }) => ({
              id: d.id, nom: d.nom, recu: d.recu,
              type: d.type || "TRONC_COMMUN", qualificationAssociee: d.qualificationAssociee || null,
              conformite: d.conformite || null, notes: d.notes || null,
              date: d.dateReception ? new Date(d.dateReception).toLocaleDateString("fr-FR") : null,
              fichierUrl: d.fichierUrl, fichierNom: d.fichierNom,
            }))
          );
        }

        // Load contacts
        if (data.contacts?.length > 0) {
          setContacts(data.contacts);
        }

        // Load projets
        if (data.projets?.length > 0) {
          setProjets(data.projets);
        }

        // Load real etapes if available
        if (data.projets?.[0]?.etapes?.length > 0) {
          setTracks(
            data.projets[0].etapes.map((e: { id: string; nom: string; delaiJours: number; terminee: boolean; active: boolean }) => ({
              id: e.id,
              nom: e.nom,
              delai: e.delaiJours || 0,
              done: e.terminee,
              active: e.active,
            }))
          );
        }

        // Qualification and formation from first project
        const qualifMap: Record<string, string> = {
          QUALIBAT_RGE: "Qualibat RGE", CERTIBAT: "Certibat", QUALIFELEC: "Qualifelec",
          QUALIT_ENR: "Qualit'ENR", QUALIPAC: "QualiPAC", QUALIPV: "QualiPV",
          QUALIBOIS: "Qualibois", QUALISOL: "Qualisol",
        };
        const firstProjet = data.projets?.[0];
        const firstQualif = firstProjet?.qualifications?.[0];
        const formations: string[] = [];
        if (firstQualif?.formationITI) formations.push("ITI");
        if (firstQualif?.formationITE) formations.push("ITE");
        if (firstQualif?.formationMenuiserie) formations.push("Menuiserie");
        if (firstQualif?.formationQUALIPAC) formations.push("QUALIPAC");
        if (firstQualif?.formationAutre) formations.push(firstQualif.formationAutre);

        setEntrepriseData({
          nom: data.nom || "",
          siret: data.siret || "",
          email: data.email || "",
          telephone: data.telephone || "",
          adresse: data.adresse || "",
          prescripteur: data.prescripteur || "",
          contact: data.contacts?.[0] ? formatContactName(data.contacts[0], data.nom) : "—",
          statutPrise: data.statutPrise || "",
          interesseTNK: data.interesseTNK || "NSP",
          statutFacturation: data.statutFacturation || "",
          miseEnRelation: data.miseEnRelation || "SANS_OBJET",
          miseEnRelationAutre: data.miseEnRelationAutre || "",
          formationsCommentaire: data.formationsCommentaire || "",
          alerte1Envoyee: data.alerte1Envoyee ? "true" : "false",
          dateAlerte1: data.dateAlerte1 || "",
          alerte2Envoyee: data.alerte2Envoyee ? "true" : "false",
          dateAlerte2: data.dateAlerte2 || "",
          mailAbandonEnvoye: data.mailAbandonEnvoye ? "true" : "false",
          dateMailAbandon: data.dateMailAbandon || "",
          depotId: data.depotId || "",
          depotNom: data.depotConfig?.nom || "",
          apporteurId: data.apporteurId || "",
          apporteurNom: data.apporteur ? `${data.apporteur.prenom ? data.apporteur.prenom + " " : ""}${data.apporteur.nom}${data.apporteur.structure ? " (" + data.apporteur.structure + ")" : ""}` : "",
          numeroCarte: data.numeroCarte || "",
          qualification: firstQualif ? qualifMap[firstQualif.type] || firstQualif.type : "",
          qualificationId: firstQualif?.id || "",
          formation: formations.length > 0 ? formations.join(", ") : "",
          formationITI: firstQualif?.formationITI ? "true" : "false",
          formationITE: firstQualif?.formationITE ? "true" : "false",
          formationMenuiserie: firstQualif?.formationMenuiserie ? "true" : "false",
          formationQUALIPAC: firstQualif?.formationQUALIPAC ? "true" : "false",
          formationTR: firstQualif?.formationTR ? "true" : "false",
          formationMenuiserieExt: firstQualif?.formationMenuiserieExt ? "true" : "false",
          formationVMC: firstQualif?.formationVMC ? "true" : "false",
          formationToituresVelux: firstQualif?.formationToituresVelux ? "true" : "false",
          formationToituresTerrasses: firstQualif?.formationToituresTerrasses ? "true" : "false",
          formationEmetteursElec: firstQualif?.formationEmetteursElec ? "true" : "false",
          formationChaudiereCogen: firstQualif?.formationChaudiereCogen ? "true" : "false",
          formationBT: firstQualif?.formationBT ? "true" : "false",
          formationHorsRenoperfITI: firstQualif?.formationHorsRenoperfITI ? "true" : "false",
          formationHorsRenoperfITE: firstQualif?.formationHorsRenoperfITE ? "true" : "false",
          chargee: firstProjet?.chargee?.prenom || "",
          dateStatutPrise: data.dateStatutPrise || "",
          dateStatutFacturation: data.dateStatutFacturation || "",
          dateInteresseTNK: data.dateInteresseTNK || "",
          dateMiseEnRelation: data.dateMiseEnRelation || "",
          dateQualification: data.dateQualification || "",
        });
      })
      .catch(() => {});

    // Fetch notes, tasks, mail templates
    fetch(`/api/notes?entrepriseId=${client.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotes(data))
      .catch(() => {});

    fetch(`/api/taches?entrepriseId=${client.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTaches(data))
      .catch(() => {});

    fetch("/api/mail-templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMailTemplates(data))
      .catch(() => {});

    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMentionUsers(data))
      .catch(() => {});

    // Load nomenclature map for qualification name display
    fetch("/api/nomenclature-qualibat?limit=500")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ code: string; nom: string }>) => {
        const map: Record<string, string> = {};
        data.forEach((q) => { map[q.code] = q.nom; });
        setNomenclatureMap(map);
      })
      .catch(() => {});

    // Load RGE nomenclature
    fetch("/api/nomenclature-rge")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNomenclatureRGE(data))
      .catch(() => {});

    fetch("/api/depot-config")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDepotConfigs(data))
      .catch(() => {});

    fetch("/api/apporteurs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setApporteurs(data))
      .catch(() => {});

    fetch("/api/antennes-qualibat")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAntennes(data))
      .catch(() => {});

    // Fetch transmissions as historique
    fetch(`/api/transmissions?entrepriseId=${client.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ id: string; canal: string; objet: string | null; destinataire: string; dateEnvoi: string; direction: string; expediteur: { prenom: string; nom: string } | null; expediteurEmail: string | null; automatique?: boolean; statutEnvoi?: string | null }>) => {
        setHistorique(data.map((t) => ({
          id: t.id,
          type: t.canal === "EMAIL" ? "EMAIL" : t.canal === "SMS" ? "SMS" : "APPEL",
          message: `${t.canal === "EMAIL" ? "Mail" : t.canal === "SMS" ? "SMS" : "Appel"} ${t.direction === "SORTANT" ? "envoyé" : "reçu"} — ${t.objet || t.destinataire}`,
          chargee: t.expediteur ? `${t.expediteur.prenom}${t.expediteurEmail ? ` (${t.expediteurEmail})` : ""}` : "—",
          time: formatRelativeTime(new Date(t.dateEnvoi)),
          automatique: t.automatique || false,
          statutEnvoi: t.statutEnvoi || null,
        })));
      })
      .catch(() => {});
  }, [client?.id]);
  const [dragFile, setDragFile] = useState(false);
  const [tab, setTab] = useState("dossier");
  const [mailOpen, setMailOpen] = useState(false);

  const toggleDoc = async (i: number) => {
    const doc = docs[i];
    const newRecu = !doc.recu;
    const n = [...docs];
    n[i] = { ...n[i], recu: newRecu, date: newRecu ? new Date().toLocaleDateString("fr-FR") : null };
    setDocs(n);

    if (newRecu) {
      const allReceived = n.every((d) => d.recu);
      if (allReceived && n.length > 0) {
        guide.showSuggestion("tous-docs-recus"); toast("Tous les documents reçus !");
      } else {
        guide.showSuggestion("document-recu"); toast("Document mis à jour");
      }
      window.dispatchEvent(new CustomEvent("tenakoe:document-received"));
    }

    // Persist to DB (skip in demo mode)
    if (doc.id && !isDemoMode) {
      fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, recu: newRecu }),
      }).catch(() => {});
    }
  };
  const docsRecu = docs.filter((d) => d.recu).length;
  const docsConformes = docs.filter((d) => d.conformite === "CONFORME").length;

  const updateConformite = async (docId: string, conformite: string | null, notes?: string | null) => {
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, conformite, notes: notes ?? d.notes } : d));
    if (!isDemoMode) {
      await fetch("/api/documents", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, conformite, ...(notes !== undefined ? { notes } : {}) }),
      }).catch(() => {});
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13, color: C.textDim }}>
        <span style={{ cursor: "pointer", color: C.blue }} onClick={onBack}>Dashboard</span>
        <ChevronRight size={13} />
        <span style={{ cursor: "pointer", color: C.blue }} onClick={onBack}>Prospects</span>
        <ChevronRight size={13} />
        <span style={{ color: C.text, fontWeight: 600 }}>{entrepriseData?.nom || client?.nom || "—"}</span>
      </div>

      {/* Demo banner */}
      {isDemoMode && (
        <div style={{
          padding: "8px 16px", borderRadius: 10, marginBottom: 16,
          background: "rgba(124,58,237,0.08)", border: "1px dashed #7c3aed",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>
            Mode démo — Les actions sont simulées, aucune donnée réelle n&apos;est modifiée
          </span>
          <Button C={C} variant="ghost" onClick={() => onBack()} style={{
            fontSize: 11, color: "#7c3aed", textDecoration: "underline",
          }}>
            Quitter la démo
          </Button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.text }}>
              {entrepriseData?.nom || client?.nom || "—"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>SIRET: {entrepriseData?.siret || client?.siret || "—"}</span>
              {entrepriseData?.qualification && <Badge color={C.blue} bg={C.blueDim}>{entrepriseData.qualification}</Badge>}
              {entrepriseData?.chargee && <Badge color={C.accentText} bg={C.accentDim}>{entrepriseData.chargee}</Badge>}
            </div>
          </div>
        </div>
        <GuideTooltip id="btn-mail" C={C}>
        <div className="fiche-actions" style={{ display: "flex", gap: 8 }}>
          {[
            { Icon: Mail, label: "Envoyer mail", guide: "btn-mail", onClick: () => { setMailOpen(!mailOpen); setSmsOpen(false); window.dispatchEvent(new CustomEvent("tenakoe:mail-opened")); } },
            { Icon: MessageSquare, label: "SMS", guide: "btn-sms", onClick: () => { setSmsOpen(!smsOpen); setMailOpen(false); } },
            { Icon: Phone, label: "Appeler", guide: "btn-appeler", onClick: () => { setShowCallLog(true); setMailOpen(false); setSmsOpen(false); } },
          ].map((btn, i) => (
            <Button key={i} C={C} variant="secondary" data-guide={btn.guide} onClick={btn.onClick} icon={<btn.Icon size={14} />} size="sm">
              {btn.label}
            </Button>
          ))}
        </div>
        </GuideTooltip>
      </div>

      {/* Mail Composer */}
      {mailOpen && (
        <div
          style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 20, marginBottom: 20, boxShadow: C.shadowHover,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nouveau mail</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setMailOpen(false)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textDim }}>À : </span>
            <span style={{ fontSize: 12, color: C.text }}>{entrepriseData?.email || "—"}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: C.textDim, marginBottom: 2, display: "block" }}>CC</label>
              <input placeholder="email1@test.fr, email2@test.fr"
                value={mailCc} onChange={(e) => setMailCc(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: C.textDim, marginBottom: 2, display: "block" }}>CCi (copie cachée)</label>
              <input placeholder="email@test.fr"
                value={mailBcc} onChange={(e) => setMailBcc(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          {sendStatus && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 8, fontSize: 12, fontWeight: 500,
              background: sendStatus.type === "success" ? C.accentDim : C.dangerDim,
              color: sendStatus.type === "success" ? C.accentText : C.danger,
            }}>
              {sendStatus.msg}
            </div>
          )}
          <input
            placeholder="Objet"
            value={mailSubject}
            onChange={(e) => setMailSubject(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13,
              marginBottom: 8, outline: "none", boxSizing: "border-box",
            }}
          />
          <textarea
            data-guide="mail-body"
            placeholder="Votre message..."
            value={mailBody}
            onChange={(e) => setMailBody(e.target.value)}
            rows={4}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text,
              fontSize: 13, marginBottom: 8, outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <select
              data-guide="template-select"
              style={{
                padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.bg, color: C.textMuted, fontSize: 12,
              }}
              onChange={(e) => {
                const tpl = mailTemplates.find((t) => t.id === e.target.value);
                if (tpl) {
                  const firstContact = contacts[0];
                  const hydrated = hydrateTemplate(tpl.contenu.replace(/<[^>]*>/g, ""), {
                    civilite: "", // chargee saisit manuellement si besoin
                    nom: firstContact ? `${firstContact.prenom} ${firstContact.nom}` : (entrepriseData?.nom || ""),
                    chargee: entrepriseData?.chargee || "",
                    expediteur: "", // remplie cote serveur via session
                    expediteur_email: "",
                    expediteur_tel: "",
                  });
                  setMailSubject(tpl.objet);
                  setMailBody(hydrated);
                }
              }}
            >
              <option value="">Modèle...</option>
              {(() => {
                const grouped: Record<string, typeof mailTemplates> = {};
                for (const t of mailTemplates) {
                  const cat = t.categorie || "Autre";
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(t);
                }
                return Object.entries(grouped).map(([cat, items]) => (
                  <optgroup key={cat} label={cat}>
                    {items.map((t) => (
                      <option key={t.id} value={t.id}>{t.nom}</option>
                    ))}
                  </optgroup>
                ));
              })()}
            </select>
            <Button
              C={C}
              variant="primary"
              data-guide="btn-send-mail"
              disabled={sending || !mailSubject}
              loading={sending}
              icon={<Send size={13} />}
              onClick={async () => {
                if (isDemoMode) {
                  handleDemoAction("Mail envoyé");
                  setSendStatus({ type: "success", msg: "Mail envoyé (démo)" }); toast("Mail envoyé");
                  setHistorique((prev) => [{ type: "EMAIL", message: `Mail envoyé — ${mailSubject}`, chargee: "Vous", time: "À l'instant" }, ...prev]);
                  guide.showSuggestion("mail-envoye");
                  window.dispatchEvent(new CustomEvent("tenakoe:mail-sent"));
                  setMailSubject(""); setMailBody(""); setMailCc(""); setMailBcc("");
                  return;
                }
                setSending(true);
                setSendStatus(null);
                try {
                  const cc = mailCc;
                  const bcc = mailBcc;
                  const res = await fetch("/api/send-mail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: entrepriseData?.email || "",
                      cc: cc || undefined,
                      bcc: bcc || undefined,
                      subject: mailSubject,
                      html: `<p>${mailBody.replace(/\n/g, "<br>")}</p>`,
                      entrepriseId: client?.id,
                    }),
                  });
                  if (res.ok) {
                    setSendStatus({ type: "success", msg: "Mail envoyé" }); toast("Mail envoyé");
                    fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aEnvoyeMail" }) }).catch(() => {});
                    guide.showSuggestion("mail-envoye");
                    window.dispatchEvent(new CustomEvent("tenakoe:mail-sent"));
                    setMailSubject("");
                    setMailBody("");
                    setMailCc("");
                    setMailBcc("");
                  } else {
                    const err = await res.json();
                    setSendStatus({ type: "error", msg: err.error || "Erreur d'envoi" });
                  }
                } catch {
                  setSendStatus({ type: "error", msg: "Erreur réseau" });
                }
                setSending(false);
              }}
              style={{
                background: sending ? "#94a3b8" : "linear-gradient(135deg, #16a34a, #15803d)",
              }}
            >
              {sending ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </div>
      )}

      {/* SMS Composer */}
      {smsOpen && (
        <div
          style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 20, marginBottom: 20, boxShadow: C.shadowHover,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Envoyer un SMS</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setSmsOpen(false)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textDim }}>À : </span>
            <span style={{ fontSize: 12, color: C.text }}>{formatPhone(entrepriseData?.telephone)}</span>
          </div>
          {sendStatus && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 8, fontSize: 12, fontWeight: 500,
              background: sendStatus.type === "success" ? C.accentDim : C.dangerDim,
              color: sendStatus.type === "success" ? C.accentText : C.danger,
            }}>
              {sendStatus.msg}
            </div>
          )}
          <textarea
            placeholder="Votre message SMS..."
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text,
              fontSize: 13, marginBottom: 8, outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.textDim }}>{smsBody.length}/160 caractères</span>
            <Button
              C={C}
              variant="primary"
              disabled={sending || !smsBody}
              loading={sending}
              icon={<MessageSquare size={13} />}
              onClick={async () => {
                if (isDemoMode) {
                  handleDemoAction("SMS envoyé");
                  setSendStatus({ type: "success", msg: "SMS envoyé (démo)" }); toast("SMS envoyé");
                  guide.showSuggestion("sms-envoye");
                  setSmsBody("");
                  return;
                }
                setSending(true);
                setSendStatus(null);
                try {
                  const res = await fetch("/api/send-sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: entrepriseData?.telephone || "",
                      message: smsBody,
                      entrepriseId: client?.id,
                    }),
                  });
                  if (res.ok) {
                    setSendStatus({ type: "success", msg: "SMS envoyé" }); toast("SMS envoyé");
                    fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aEnvoyeSms" }) }).catch(() => {});
                    guide.showSuggestion("sms-envoye");
                    setSmsBody("");
                  } else {
                    const err = await res.json();
                    setSendStatus({ type: "error", msg: err.error || "Erreur d'envoi" });
                  }
                } catch {
                  setSendStatus({ type: "error", msg: "Erreur réseau" });
                }
                setSending(false);
              }}
              style={{
                background: sending ? "#94a3b8" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
              }}
            >
              {sending ? "Envoi..." : "Envoyer SMS"}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-row" style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "dossier", label: "Dossier", Icon: FolderOpen },
          { id: "docs", label: `Documents (${docsRecu}/${docs.length})`, Icon: FileText },
          { id: "track", label: "Feuille de route", Icon: ClipboardList },
          { id: "historique", label: "Historique", Icon: RefreshCw },
          { id: "contacts", label: `Contacts (${contacts.length})`, Icon: UserCircle },
          { id: "taches", label: `Tâches (${taches.length})`, Icon: ClipboardList },
          { id: "notes", label: `Notes (${notes.length})`, Icon: StickyNote },
        ].map((t) => (
          <Button
            C={C}
            variant="ghost"
            key={t.id}
            data-guide={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            style={{
              borderRadius: "8px 8px 0 0",
              background: tab === t.id ? C.surface : "transparent",
              borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
              color: tab === t.id ? C.accentText : C.textMuted,
            }}
          >
            <t.Icon size={14} /> {t.label}
          </Button>
        ))}
      </div>

      {/* Call Log */}
      {showCallLog && (
        <div style={{
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 20, boxShadow: C.shadowHover,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Loguer un appel</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setShowCallLog(false)} />
          </div>

          <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.textDim }}>Numéro : </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatPhone(entrepriseData?.telephone)}</span>
          </div>

          <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Date et heure</label>
              <input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)}
                id="call-datetime"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Durée</label>
              <select id="call-duration" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12 }}>
                <option value="5 min">5 min</option>
                <option value="10 min">10 min</option>
                <option value="15 min" selected>15 min</option>
                <option value="30 min">30 min</option>
                <option value="45 min">45 min</option>
                <option value="1h">1h</option>
                <option value="1h+">1h+</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Résultat</label>
              <select id="call-result" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12 }}>
                <option value="Répondu — échange positif">Répondu — échange positif</option>
                <option value="Répondu — rappeler plus tard">Répondu — rappeler plus tard</option>
                <option value="Répondu — pas intéressé">Répondu — pas intéressé</option>
                <option value="Pas de réponse">Pas de réponse</option>
                <option value="Messagerie">Messagerie</option>
                <option value="Numéro invalide">Numéro invalide</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Notes de l&apos;appel</label>
            <textarea
              placeholder="Résumé de la conversation..."
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.bg, color: C.text,
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button C={C} variant="ghost" onClick={() => { setShowCallLog(false); setCallNote(""); }}>Annuler</Button>
            <Button
              C={C}
              variant="primary"
              icon={<Phone size={13} />}
              onClick={async () => {
                if (isDemoMode) {
                  handleDemoAction("Appel enregistré");
                  setShowCallLog(false);
                  setCallNote("");
                  setSendStatus({ type: "success", msg: "Appel logué (démo)" }); toast("Appel enregistré");
                  guide.showSuggestion("appel-logue");
                  return;
                }
                if (!client?.id) return;
                const datetime = (document.getElementById("call-datetime") as HTMLInputElement)?.value;
                const duration = (document.getElementById("call-duration") as HTMLSelectElement)?.value;
                const result = (document.getElementById("call-result") as HTMLSelectElement)?.value;
                const contenu = `[${duration}] ${result}\n${callNote}`.trim();

                await fetch("/api/transmissions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    canal: "TELEPHONE",
                    direction: "SORTANT",
                    destinataire: entrepriseData?.telephone || "—",
                    objet: result,
                    contenu,
                    entrepriseId: client.id,
                  }),
                });
                setShowCallLog(false);
                setCallNote("");
                setSendStatus({ type: "success", msg: "Appel enregistré" }); toast("Appel enregistré");
                guide.showSuggestion("appel-logue");
              }}
              style={{
                background: "linear-gradient(135deg, #16a34a, #15803d)",
              }}
            >
              Enregistrer l&apos;appel
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Dossier */}
      {tab === "dossier" && (
        <div className="fiche-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Informations entreprise</h3>
            {[
              { label: "Entreprise", key: "nom", value: entrepriseData?.nom || client?.nom || "—", Icon: Building2 },
              { label: "SIRET", key: "siret", value: entrepriseData?.siret || client?.siret || "—", Icon: FileText },
              { label: "Contact", key: "contact", value: entrepriseData?.contact || "—", Icon: UserCircle },
              { label: "Email", key: "email", value: entrepriseData?.email || "—", Icon: Mail },
              { label: "Téléphone", key: "telephone", value: formatPhone(entrepriseData?.telephone), Icon: Phone },
              { label: "Adresse", key: "adresse", value: entrepriseData?.adresse || "—", Icon: Building2 },
              { label: "Prescripteur", key: "prescripteur", value: entrepriseData?.prescripteur || client?.prescripteur || "—", Icon: Building2 },
              { label: "Dépôt", key: "depotId", value: entrepriseData?.depotNom || "—", Icon: Building2 },
              { label: "Apporteur", key: "apporteurId", value: entrepriseData?.apporteurNom || "—", Icon: Handshake },
              { label: "N° carte", key: "numeroCarte", value: entrepriseData?.numeroCarte || "—", Icon: FileText },
            ].map((f, i) => {
              const saveField = async (val: string) => {
                const original = f.value === "\u2014" ? "" : f.value;
                if (val !== original && val.trim()) {
                  setEntrepriseData((prev) => prev ? { ...prev, [f.key]: val } : prev);
                  if (client?.id && !isDemoMode) {
                    await fetch(`/api/entreprises/${client.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ [f.key]: val }),
                    });
                  }
                }
                setEditingField(null);
              };

              return (
              <div
                key={i}
                className="info-row"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: i < 7 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (editingField === f.key || f.key === "contact") return;
                  setEditingField(f.key);
                  setEditFieldValue(f.value === "—" ? "" : f.value);
                }}
              >
                <f.Icon size={14} color={C.textDim} />
                <span style={{ fontSize: 12, color: C.textDim, width: 90 }}>{f.label}</span>
                {editingField === f.key && f.key === "prescripteur" ? (
                  <select
                    autoFocus
                    value={editFieldValue}
                    onChange={(e) => setEditFieldValue(e.target.value)}
                    onBlur={() => saveField(editFieldValue)}
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.accent}`, background: C.bg, color: C.text,
                      fontSize: 13, fontWeight: 500, outline: "none",
                    }}
                  >
                    <option value="">Aucun</option>
                    <option value="PDB">PDB</option>
                    <option value="POINT_P">Point P</option>
                    <option value="BIGMAT">Big Mat</option>
                  </select>
                ) : editingField === f.key && f.key === "depotId" ? (
                  <select
                    autoFocus
                    value={entrepriseData?.depotId || ""}
                    onChange={async (e) => {
                      const depotId = e.target.value || null;
                      const depotNom = depotConfigs.find((d) => d.id === depotId)?.nom || "";
                      setEntrepriseData((prev) => prev ? { ...prev, depotId: depotId || "", depotNom } : prev);
                      if (client?.id && !isDemoMode) {
                        await fetch(`/api/entreprises/${client.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ depotId }),
                        });
                      }
                      setEditingField(null);
                    }}
                    onBlur={() => setEditingField(null)}
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.accent}`, background: C.bg, color: C.text,
                      fontSize: 13, fontWeight: 500, outline: "none",
                    }}
                  >
                    <option value="">-- Aucun --</option>
                    {depotConfigs.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                ) : editingField === f.key && f.key === "apporteurId" ? (
                  <select
                    autoFocus
                    value={entrepriseData?.apporteurId || ""}
                    onChange={async (e) => {
                      const apporteurId = e.target.value || null;
                      const sel = apporteurs.find((a) => a.id === apporteurId);
                      const apporteurNom = sel ? `${sel.prenom ? sel.prenom + " " : ""}${sel.nom}${sel.structure ? " (" + sel.structure + ")" : ""}` : "";
                      setEntrepriseData((prev) => prev ? { ...prev, apporteurId: apporteurId || "", apporteurNom } : prev);
                      if (client?.id && !isDemoMode) {
                        await fetch(`/api/entreprises/${client.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ apporteurId }),
                        });
                      }
                      setEditingField(null);
                    }}
                    onBlur={() => setEditingField(null)}
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.accent}`, background: C.bg, color: C.text,
                      fontSize: 13, fontWeight: 500, outline: "none",
                    }}
                  >
                    <option value="">-- Aucun --</option>
                    {apporteurs.map((a) => <option key={a.id} value={a.id}>{a.prenom ? a.prenom + " " : ""}{a.nom}{a.structure ? ` (${a.structure})` : ""}</option>)}
                  </select>
                ) : editingField === f.key ? (
                  <input
                    autoFocus
                    value={editFieldValue}
                    onChange={(e) => setEditFieldValue(e.target.value)}
                    onBlur={() => saveField(editFieldValue)}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingField(null); }}
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.accent}`, background: C.bg, color: C.text,
                      fontSize: 13, fontWeight: 500, outline: "none",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{f.value}</span>
                )}
                {f.key !== "contact" && editingField !== f.key && <Edit3 size={11} color={C.textDim} style={{ marginLeft: "auto", opacity: 0.5 }} />}
              </div>
              );
            })}
          </div>
          {/* BLOC 1 — Statut & Facturation (allégé) */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Statut & Facturation</h3>
            {[
              { label: "Intéressé TNK", key: "interesseTNK", dateKey: "dateInteresseTNK", value: formatInteretTNK(entrepriseData?.interesseTNK), raw: entrepriseData?.interesseTNK, options: [{ v: "OUI", l: "Oui" }, { v: "NON", l: "Non" }, { v: "NSP", l: "NSP" }] },
            ].map((f, i) => (
              <div key={i} className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
                <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <select
                    value={f.raw || ""}
                    onChange={async (e) => {
                      if (!client?.id) return;
                      const val = e.target.value;
                      await fetch(`/api/entreprises/${client.id}`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ [f.key]: val }),
                      });
                      setEntrepriseData((prev) => prev ? { ...prev, [f.key]: val, [f.dateKey]: new Date().toISOString() } : prev);
                    }}
                    style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 600 }}
                  >
                    {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                {entrepriseData?.[f.dateKey] && (
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
                    Modifié le {new Date(entrepriseData[f.dateKey]).toLocaleDateString("fr-FR")}
                  </div>
                )}
                </div>
              </div>
            ))}
            {[
              { label: "Statut", value: formatStatutPrise(entrepriseData?.statutPrise), dateKey: "dateStatutPrise" },
              { label: "Facturation", value: formatStatutFacturation(entrepriseData?.statutFacturation), dateKey: "dateStatutFacturation" },
            ].map((f, i) => (
              <div key={`s${i}`} className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
                <div>
                  <Badge color={C.accentText} bg={C.accentDim}>{f.value}</Badge>
                  {entrepriseData?.[f.dateKey] && (
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
                      Modifié le {new Date(entrepriseData[f.dateKey]).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Qualifications (all from all projects) */}
            <div className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>Qualifications</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {projets.flatMap((p) => p.qualifications).length > 0
                  ? projets.flatMap((p) => p.qualifications).map((q) => (
                    <Badge key={q.type} color={C.blue} bg={C.blueDim}>
                      {q.type}{nomenclatureMap[q.type] ? ` — ${nomenclatureMap[q.type]}` : ""}
                    </Badge>
                  ))
                  : <span style={{ fontSize: 13, color: C.textDim }}>—</span>
                }
              </div>
            </div>
            {/* Feuille de route progression */}
            {(() => {
              const etapes = projets[0]?.etapes || [];
              if (etapes.length === 0) return null;
              const done = etapes.filter((e) => e.terminee).length;
              const active = etapes.find((e) => e.active);
              const allDone = done === etapes.length;
              return (
                <div style={{ padding: "8px 0", fontSize: 11, color: allDone ? "#16a34a" : C.textDim }}>
                  Feuille de route : Étape {done}/{etapes.length} — {allDone ? "Terminée ✓" : active ? active.nom : "Non démarrée"}
                </div>
              );
            })()}
          </div>

          {/* Formation (unifié) */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Formation</h3>
            {(() => {
              const qualifId = entrepriseData?.qualificationId;
              const toggleFormation = async (key: string) => {
                if (!qualifId) return;
                const checked = entrepriseData?.[key] === "true";
                const newVal = !checked;
                setEntrepriseData((prev) => prev ? { ...prev, [key]: String(newVal) } : prev);
                fetch(`/api/qualifications/${qualifId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: newVal }) }).catch(() => {});
              };
              const renderCheckbox = (key: string, label: string) => {
                const checked = entrepriseData?.[key] === "true";
                return (
                  <label key={key} onClick={() => toggleFormation(key)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
                    borderRadius: 8, cursor: qualifId ? "pointer" : "default",
                    background: checked ? C.accentDim : C.bg,
                    border: `1px solid ${checked ? C.accent + "40" : C.border}`,
                    transition: "all 0.15s", fontSize: 11,
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${checked ? C.accent : C.border}`, background: checked ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checked && <Check size={9} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontWeight: checked ? 600 : 400, color: checked ? C.accentText : C.textMuted }}>{label}</span>
                  </label>
                );
              };
              return (
                <>
                  {/* Sous-section 1 : Modules RENOPERF */}
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 8, fontWeight: 600 }}>Modules RENOPERF nécessaires</span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                      {renderCheckbox("formationTR", "TR")}
                      {renderCheckbox("formationITI", "ITI")}
                      {renderCheckbox("formationITE", "ITE")}
                      {renderCheckbox("formationMenuiserieExt", "Menuiserie Ext")}
                      {renderCheckbox("formationVMC", "VMC")}
                      {renderCheckbox("formationToituresVelux", "Toitures Ext-Velux")}
                      {renderCheckbox("formationToituresTerrasses", "Toitures Terrasses")}
                      {renderCheckbox("formationEmetteursElec", "Émetteurs Élec")}
                      {renderCheckbox("formationChaudiereCogen", "Chaudière cogén")}
                      {renderCheckbox("formationBT", "BT")}
                    </div>
                  </div>

                  {/* Sous-section 2 : RENOPERF mise en relation */}
                  <div style={{ marginBottom: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 8, fontWeight: 600 }}>RENOPERF mise en relation</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <select
                        value={entrepriseData?.miseEnRelation || "SANS_OBJET"}
                        onChange={async (e) => {
                          if (!client?.id) return;
                          const val = e.target.value;
                          await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ miseEnRelation: val }) });
                          setEntrepriseData((prev) => prev ? { ...prev, miseEnRelation: val, dateMiseEnRelation: new Date().toISOString() } : prev);
                        }}
                        style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 600 }}
                      >
                        {[{ v: "SANS_OBJET", l: "Sans objet" }, { v: "APEE", l: "APEE" }, { v: "CEEF", l: "CEEF" }, { v: "HORMEE", l: "HORMEE" }, { v: "AUTRE", l: "Autre" }].map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                      {entrepriseData?.miseEnRelation === "AUTRE" && (
                        <input type="text" placeholder="Préciser…" defaultValue={entrepriseData?.miseEnRelationAutre || ""}
                          onBlur={async (e) => { if (!client?.id) return; const val = e.target.value; await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ miseEnRelationAutre: val }) }); setEntrepriseData((prev) => prev ? { ...prev, miseEnRelationAutre: val } : prev); }}
                          style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, width: 140 }} />
                      )}
                      {entrepriseData?.dateMiseEnRelation && (
                        <span style={{ fontSize: 10, color: C.textDim }}>Modifié le {new Date(entrepriseData.dateMiseEnRelation).toLocaleDateString("fr-FR")}</span>
                      )}
                    </div>
                  </div>

                  {/* Sous-section 3 : Autres formations hors Renoperf */}
                  <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 8, fontWeight: 600 }}>Autres formations hors Renoperf</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {renderCheckbox("formationHorsRenoperfITI", "ITI")}
                      {renderCheckbox("formationHorsRenoperfITE", "ITE")}
                      {renderCheckbox("formationMenuiserie", "Menuiserie")}
                      {renderCheckbox("formationQUALIPAC", "QUALIPAC")}
                    </div>
                    <textarea
                      key={`formationsCommentaire-${entrepriseData?.formationsCommentaire || ""}`}
                      placeholder="Notes sur les autres formations prévues ou réalisées..."
                      defaultValue={entrepriseData?.formationsCommentaire || ""}
                      onBlur={async (e) => { if (!client?.id) return; const val = e.target.value; await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formationsCommentaire: val }) }); setEntrepriseData((prev) => prev ? { ...prev, formationsCommentaire: val } : prev); }}
                      style={{ width: "100%", minHeight: 60, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, fontFamily: "inherit", resize: "vertical" }}
                    />
                  </div>
                </>
              );
            })()}
          </div>

          {/* Chantiers de référence */}
          {projets.some((p) => p.qualifications.length > 0) && (() => {
            const currentProjet = projets[0];
            const chantiers = (currentProjet?.chantiers || []) as ChantierData[];
            const chantiersComplets = chantiers.filter((c) => c.numero <= 3 ? (c.devisRecu && c.factureRecue && c.attestationRecue) : c.documents.length > 0).length;
            const chantiersMain = chantiers.filter((c) => c.numero <= 3);

            const updateChantier = async (chantierId: string, patch: Record<string, unknown>) => {
              if (isDemoMode) return;
              const res = await fetch(`/api/chantiers/${chantierId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
              if (res.ok) {
                const updated = await res.json();
                setProjets((prev) => prev.map((pr) => pr.id === currentProjet?.id ? { ...pr, chantiers: (pr.chantiers || []).map((c: ChantierData) => c.id === chantierId ? updated : c) } : pr));
              }
            };

            const uploadChantierDoc = async (chantierId: string, file: File) => {
              const formData = new FormData();
              formData.append("file", file);
              const res = await fetch(`/api/chantiers/${chantierId}/documents`, { method: "POST", body: formData });
              if (res.ok) {
                const doc = await res.json();
                setProjets((prev) => prev.map((pr) => pr.id === currentProjet?.id ? { ...pr, chantiers: (pr.chantiers || []).map((c: ChantierData) => c.id === chantierId ? { ...c, documents: [doc, ...c.documents] } : c) } : pr));
                toast("Document uploadé");
              }
            };

            const deleteChantierDoc = async (chantierId: string, docId: string) => {
              await fetch(`/api/chantiers/${chantierId}/documents?docId=${docId}`, { method: "DELETE" });
              setProjets((prev) => prev.map((pr) => pr.id === currentProjet?.id ? { ...pr, chantiers: (pr.chantiers || []).map((c: ChantierData) => c.id === chantierId ? { ...c, documents: c.documents.filter((d) => d.id !== docId) } : c) } : pr));
            };

            const getChantierStatus = (c: ChantierData) => {
              if (c.numero <= 3) {
                if (c.devisRecu && c.factureRecue && c.attestationRecue) return "complet";
                if (c.devisRecu || c.factureRecue || c.attestationRecue || c.documents.length > 0) return "en-cours";
                return "vide";
              }
              return c.documents.length > 0 ? "complet" : "vide";
            };

            const statusColor = (s: string) => s === "complet" ? "#16a34a" : s === "en-cours" ? "#f59e0b" : C.textDim;

            return (
              <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Chantiers de référence</h3>
                  <span style={{ fontSize: 12, color: C.textDim }}>{chantiersComplets}/{chantiersMain.length} complets</span>
                </div>

                {chantiers.length === 0 && (
                  <p style={{ fontSize: 12, color: C.textDim, textAlign: "center", padding: 16 }}>
                    Les chantiers seront créés automatiquement lors de la génération des documents.
                  </p>
                )}

                {chantiers.map((c) => {
                  const status = getChantierStatus(c);
                  const isOpen = expandedCols[`chantier-${c.id}`] !== false;
                  const title = c.numero <= 3 ? `Chantier ${c.numero}` : "Chantier supplémentaire";

                  return (
                    <div key={c.id} style={{ marginBottom: 8, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                      {/* Header */}
                      <div
                        onClick={() => setExpandedCols((prev) => ({ ...prev, [`chantier-${c.id}`]: !isOpen }))}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, cursor: "pointer" }}
                      >
                        <ChevronRight size={14} color={C.textDim} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                        {status === "complet" ? <CheckCircle size={14} color="#16a34a" /> : status === "en-cours" ? <Clock size={14} color="#f59e0b" /> : <Circle size={14} color={C.textDim} />}
                        <span style={{ fontSize: 13, fontWeight: 600, color: statusColor(status), flex: 1 }}>{title}</span>
                        <input
                          value={c.nom || ""}
                          placeholder="Nom / adresse..."
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setProjets((prev) => prev.map((pr) => pr.id === currentProjet?.id ? { ...pr, chantiers: (pr.chantiers || []).map((ch: ChantierData) => ch.id === c.id ? { ...ch, nom: e.target.value } : ch) } : pr))}
                          onBlur={(e) => updateChantier(c.id, { nom: e.target.value || null })}
                          style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, width: 180, outline: "none" }}
                        />
                      </div>

                      {isOpen && (
                        <div style={{ padding: "12px 14px" }}>
                          {/* Obligatory docs for chantiers 1-3 */}
                          {c.numero <= 3 && [
                            { key: "devis", label: "Devis", recu: c.devisRecu, fichierUrl: c.devisFichierUrl, fichierNom: c.devisFichierNom, date: c.dateDevis, recuKey: "devisRecu", urlKey: "devisFichierUrl", nomKey: "devisFichierNom" },
                            { key: "facture", label: "Facture", recu: c.factureRecue, fichierUrl: c.factureFichierUrl, fichierNom: c.factureFichierNom, date: c.dateFacture, recuKey: "factureRecue", urlKey: "factureFichierUrl", nomKey: "factureFichierNom" },
                            { key: "attestation", label: "Attestation de travaux", recu: c.attestationRecue, fichierUrl: c.attestationFichierUrl, fichierNom: c.attestationFichierNom, date: c.dateAttestation, recuKey: "attestationRecue", urlKey: "attestationFichierUrl", nomKey: "attestationFichierNom" },
                          ].map((doc) => (
                            <div key={doc.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                              <div onClick={() => updateChantier(c.id, { [doc.recuKey]: !doc.recu })} style={{
                                width: 20, height: 20, borderRadius: 5,
                                border: `2px solid ${doc.recu ? C.accent : C.border}`,
                                background: doc.recu ? C.accent : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", flexShrink: 0,
                              }}>
                                {doc.recu && <Check size={11} color="#fff" strokeWidth={3} />}
                              </div>
                              <span style={{ fontSize: 12, color: doc.recu ? C.text : C.textMuted, fontWeight: doc.recu ? 500 : 400, flex: 1 }}>{doc.label}</span>
                              {doc.date && <span style={{ fontSize: 10, color: C.textDim }}>{new Date(doc.date).toLocaleDateString("fr-FR")}</span>}
                              {doc.fichierUrl ? (
                                <a href={fixFileUrl(doc.fichierUrl)} download={doc.fichierNom || doc.label} onClick={(e) => e.stopPropagation()}
                                  style={{ padding: "2px 8px", borderRadius: 6, background: C.blueDim, color: C.blue, fontSize: 10, fontWeight: 600, textDecoration: "none" }}>
                                  <Download size={10} /> {doc.fichierNom || "Fichier"}
                                </a>
                              ) : doc.recu ? (
                                <label style={{ padding: "2px 8px", borderRadius: 6, background: C.accentDim, color: C.accentText, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                                  <Upload size={10} /> Uploader
                                  <input type="file" style={{ display: "none" }} onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    const res = await fetch("/api/upload", { method: "POST", body: formData });
                                    if (res.ok) {
                                      const { url } = await res.json();
                                      updateChantier(c.id, { [doc.urlKey]: url, [doc.nomKey]: file.name });
                                    }
                                  }} />
                                </label>
                              ) : null}
                            </div>
                          ))}

                          {/* Free documents */}
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 6 }}>Documents complémentaires</div>
                            {c.documents.map((d) => (
                              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 11 }}>
                                <Paperclip size={11} color={C.textDim} />
                                <span style={{ flex: 1, color: C.text }}>{d.fichierNom || d.nom}</span>
                                {d.fichierUrl && (
                                  <a href={fixFileUrl(d.fichierUrl)} download={d.fichierNom || d.nom} style={{ color: C.blue, textDecoration: "none", fontSize: 10 }}>
                                    <Download size={10} />
                                  </a>
                                )}
                                <button onClick={() => deleteChantierDoc(c.id, d.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                                  <Trash2 size={10} color={C.textDim} />
                                </button>
                              </div>
                            ))}
                            <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px dashed ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer", marginTop: 6 }}>
                              <Plus size={11} /> Ajouter un document
                              <input type="file" style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadChantierDoc(c.id, file);
                                e.target.value = "";
                              }} />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Certificateur */}
          <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Certificateur</h3>
            {(() => {
              const currentProjet = projets[0];
              const certType = currentProjet?.certificateurType || "Qualibat";
              const isQualibat = certType === "Qualibat";
              const currentAntenneId = currentProjet?.antenneQualibatId || "";
              const selectedAntenne = antennes.find((a) => a.id === currentAntenneId);
              const updateProjet = async (patch: Record<string, unknown>) => {
                if (!currentProjet?.id || isDemoMode) return;
                await fetch(`/api/projets/${currentProjet.id}`, {
                  method: "PATCH", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(patch),
                });
                setProjets((prev) => prev.map((p) => p.id === currentProjet.id ? { ...p, ...patch } : p));
              };
              const iStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const };
              return (
                <>
                <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {/* Type de certificateur */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Type de certificateur</label>
                    <select value={certType} onChange={(e) => updateProjet({ certificateurType: e.target.value })} disabled={!currentProjet} style={iStyle}>
                      <option value="Qualibat">Qualibat</option>
                      <option value="Certibat">Certibat</option>
                      <option value="Qualit'EnR">Qualit&apos;EnR</option>
                      <option value="Qualifelec">Qualifelec</option>
                    </select>
                  </div>
                  {/* Antenne Qualibat (only if Qualibat) */}
                  {isQualibat && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Antenne Qualibat</label>
                      <select value={currentAntenneId} onChange={(e) => updateProjet({ antenneQualibatId: e.target.value || null })} disabled={!currentProjet} style={iStyle}>
                        <option value="">-- Sélectionner --</option>
                        {antennes.map((a) => <option key={a.id} value={a.id}>{a.nom}{a.delegation ? ` (${a.delegation})` : ""}</option>)}
                      </select>
                      {selectedAntenne && (selectedAntenne.email || selectedAntenne.telephone) && (
                        <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                          {selectedAntenne.email && <span>{selectedAntenne.email}</span>}
                          {selectedAntenne.telephone && <span>{formatPhone(selectedAntenne.telephone)}</span>}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Email certificateur */}
                  <div>
                    <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Email certificateur</label>
                    <input type="email" value={currentProjet?.emailCertificateur || ""}
                      onChange={(e) => setProjets((prev) => prev.map((p) => p.id === currentProjet?.id ? { ...p, emailCertificateur: e.target.value } : p))}
                      onBlur={(e) => updateProjet({ emailCertificateur: e.target.value || null })}
                      disabled={!currentProjet} placeholder="email@certificateur.fr" style={iStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Identifiant</label>
                    <input type="text" value={currentProjet?.identifiantQualibat || ""}
                      onChange={(e) => setProjets((prev) => prev.map((p) => p.id === currentProjet?.id ? { ...p, identifiantQualibat: e.target.value } : p))}
                      onBlur={(e) => updateProjet({ identifiantQualibat: e.target.value || null })}
                      disabled={!currentProjet} placeholder="Identifiant espace" style={iStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Mot de passe</label>
                    <input type="text" value={currentProjet?.motDePasseQualibat || ""}
                      onChange={(e) => setProjets((prev) => prev.map((p) => p.id === currentProjet?.id ? { ...p, motDePasseQualibat: e.target.value } : p))}
                      onBlur={(e) => updateProjet({ motDePasseQualibat: e.target.value || null })}
                      disabled={!currentProjet} placeholder="Mot de passe espace" style={iStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Interlocuteur</label>
                    <input type="text" value={currentProjet?.interlocuteurQualibat || ""}
                      onChange={(e) => setProjets((prev) => prev.map((p) => p.id === currentProjet?.id ? { ...p, interlocuteurQualibat: e.target.value } : p))}
                      onBlur={(e) => updateProjet({ interlocuteurQualibat: e.target.value || null })}
                      disabled={!currentProjet} placeholder="Nom de l'instructeur" style={iStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Date de commission</label>
                    <input type="date" value={currentProjet?.dateCommission ? new Date(currentProjet.dateCommission).toISOString().slice(0, 10) : ""}
                      onChange={(e) => updateProjet({ dateCommission: e.target.value || null })}
                      disabled={!currentProjet} style={iStyle} />
                  </div>
                </div>
                {/* Bon de commande certificateur */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                  {[
                    { key: "bonCommandeDemande", dateKey: "dateBonCommandeDemande", label: "Bon de commande demandé" },
                    { key: "bonCommandePaye", dateKey: "dateBonCommandePaye", label: "Bon de commande payé" },
                  ].map((f) => {
                    const checked = !!(currentProjet as Record<string, unknown>)?.[f.key];
                    const date = (currentProjet as Record<string, unknown>)?.[f.dateKey] as string | null;
                    return (
                      <label key={f.key} onClick={async () => {
                        if (!currentProjet?.id || isDemoMode) return;
                        const newVal = !checked;
                        updateProjet({ [f.key]: newVal, [f.dateKey]: newVal ? new Date().toISOString() : null });
                      }} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                        borderRadius: 8, cursor: "pointer",
                        background: checked ? C.accentDim : C.bg,
                        border: `1px solid ${checked ? C.accent + "40" : C.border}`,
                        transition: "all 0.15s",
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: `2px solid ${checked ? C.accent : C.border}`,
                          background: checked ? C.accent : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? C.accentText : C.text, flex: 1 }}>{f.label}</span>
                        {date && <span style={{ fontSize: 11, color: C.textDim }}>le {new Date(date).toLocaleDateString("fr-FR")}</span>}
                      </label>
                    );
                  })}
                </div>
                </>
              );
            })()}
          </div>

          {/* Procédure alerte avant abandon */}
          <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Procédure alerte avant abandon</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "alerte1Envoyee", dateKey: "dateAlerte1", label: "Alerte 1 envoyée" },
                { key: "alerte2Envoyee", dateKey: "dateAlerte2", label: "Alerte 2 envoyée" },
                { key: "mailAbandonEnvoye", dateKey: "dateMailAbandon", label: "Mail abandon envoyé" },
              ].map((f) => {
                const checked = entrepriseData?.[f.key] === "true";
                const date = entrepriseData?.[f.dateKey];
                return (
                  <label key={f.key} onClick={async () => {
                    if (!client?.id || isDemoMode) return;
                    const newVal = !checked;
                    const newDate = newVal ? new Date().toISOString() : "";
                    setEntrepriseData((prev) => prev ? { ...prev, [f.key]: String(newVal), [f.dateKey]: newDate } : prev);
                    await fetch(`/api/entreprises/${client.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ [f.key]: newVal, [f.dateKey]: newVal ? new Date().toISOString() : null }),
                    }).catch(() => {});
                  }} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                    borderRadius: 8, cursor: "pointer",
                    background: checked ? C.accentDim : C.bg,
                    border: `1px solid ${checked ? C.accent + "40" : C.border}`,
                    transition: "all 0.15s",
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `2px solid ${checked ? C.accent : C.border}`,
                      background: checked ? C.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? C.accentText : C.text, flex: 1 }}>{f.label}</span>
                    {date && (
                      <span style={{ fontSize: 11, color: C.textDim }}>
                        le {new Date(date).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Projets */}
          <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Projets / Dossiers</h3>
              <Button C={C} variant="secondary" data-guide="btn-nouveau-projet" onClick={() => setShowAddProjet(!showAddProjet)} icon={<Plus size={12} />} size="sm">
                Nouveau projet
              </Button>
            </div>

            {showAddProjet && (
              <div style={{ padding: 14, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input placeholder="Nom du projet *" value={newProjetForm.nom} onChange={(e) => setNewProjetForm({ ...newProjetForm, nom: e.target.value })}
                    style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                  <select value={newProjetForm.chargeeId} onChange={(e) => setNewProjetForm({ ...newProjetForm, chargeeId: e.target.value })}
                    style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }}>
                    <option value="">Chargée (moi par défaut)</option>
                    {mentionUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                    ))}
                  </select>
                </div>
                {/* Multi-qualification search + list */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ position: "relative" }}>
                    <input
                      placeholder="+ Ajouter une qualification (code ou nom)..."
                      value={qualifSearch}
                      onChange={(e) => {
                        setQualifSearch(e.target.value);
                        if (e.target.value.length >= 2) {
                          fetch(`/api/nomenclature-qualibat?search=${encodeURIComponent(e.target.value)}`)
                            .then((r) => r.json()).then(setQualifResults).catch(() => {});
                        } else { setQualifResults([]); }
                      }}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                    />
                    {qualifResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: C.shadowHover, maxHeight: 180, overflowY: "auto" }}>
                        {qualifResults.filter((q) => !newProjetForm.qualifications.some((s) => s.code === q.code)).map((q) => (
                          <button key={q.code} onClick={() => {
                            setNewProjetForm({ ...newProjetForm, qualifications: [...newProjetForm.qualifications, { code: q.code, nom: q.nom }] });
                            setQualifSearch(""); setQualifResults([]);
                          }} style={{ width: "100%", padding: "6px 10px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 11, color: C.text, borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <span style={{ fontWeight: 700, color: C.blue }}>{q.code}</span>
                            <span style={{ marginLeft: 6 }}>{q.nom}</span>
                            <span style={{ marginLeft: 6, fontSize: 10, color: C.textDim }}>{q.categorie}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {newProjetForm.qualifications.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {newProjetForm.qualifications.map((q) => (
                        <span key={q.code} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 8, background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 600 }}>
                          {q.code} — {q.nom}
                          <X size={11} style={{ cursor: "pointer" }} onClick={() => setNewProjetForm({ ...newProjetForm, qualifications: newProjetForm.qualifications.filter((s) => s.code !== q.code) })} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button C={C} variant="ghost" onClick={() => setShowAddProjet(false)}>Annuler</Button>
                  <Button C={C} variant="primary" disabled={!newProjetForm.nom} onClick={async () => {
                    if (!newProjetForm.nom) return;
                    if (isDemoMode) {
                      handleDemoAction("Projet créé");
                      setProjets((prev) => [...prev, { id: `demo-projet-${Date.now()}`, nom: newProjetForm.nom, qualifications: newProjetForm.qualifications.map((q) => ({ type: q.code })), etapes: [] }]);
                      setShowAddProjet(false);
                      setNewProjetForm({ nom: "", qualifications: [], chargeeId: "" });
                      guide.showSuggestion("nouveau-projet"); toast("Projet créé");
                      return;
                    }
                    if (!client?.id) return;
                    const payload: Record<string, unknown> = { nom: newProjetForm.nom, entrepriseId: client.id };
                    if (newProjetForm.qualifications.length > 0) payload.qualifications = newProjetForm.qualifications.map((q) => ({ type: q.code }));
                    if (newProjetForm.chargeeId) payload.chargeeId = newProjetForm.chargeeId;
                    const res = await fetch("/api/projets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                    if (res.ok) {
                      setShowAddProjet(false);
                      setNewProjetForm({ nom: "", qualifications: [], chargeeId: "" });
                      guide.showSuggestion("nouveau-projet"); toast("Projet créé");
                      fetch(`/api/entreprises/${client.id}`).then((r) => r.ok ? r.json() : null).then((data) => {
                        if (data?.projets) setProjets(data.projets);
                      }).catch(() => {});
                    }
                  }}>Créer</Button>
                </div>
              </div>
            )}

            {projets.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun projet</div>
            ) : projets.map((p) => {
              const etapesDone = p.etapes?.filter((e) => e.terminee).length || 0;
              const etapesTotal = p.etapes?.length || 0;
              const bons = (p.bonsDeCommande || []) as BonDeCommande[];
              return (
                <div key={p.id} style={{ padding: "12px 8px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <FolderOpen size={16} color={C.purple} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.nom}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {p.qualifications.map((q) => (
                          <Badge key={q.type} color={C.blue} bg={C.blueDim}>
                            {q.type}{nomenclatureMap[q.type] ? ` — ${nomenclatureMap[q.type]}` : ""}
                          </Badge>
                        ))}
                        {p.qualifications.length === 0 && <span style={{ fontSize: 11, color: C.textDim }}>Aucune qualification</span>}
                      </div>
                      <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{etapesDone}/{etapesTotal} étapes</div>
                    </div>
                  </div>

                  {/* Qualifications détails (RGE + niveaux) */}
                  {p.qualifications.map((q) => {
                    if (!q.id) return null;
                    const qualifId = q.id;
                    const selectedCodes = (q.rges || []).map((r) => r.rgeCode);

                    const updateQualif = async (patch: Record<string, unknown>) => {
                      if (isDemoMode) return;
                      try {
                        const res = await fetch(`/api/qualifications/${qualifId}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(patch),
                        });
                        if (!res.ok) throw new Error("Erreur API");
                        const updated = await res.json();
                        setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, niveauVise: updated.niveauVise, niveauObtenu: updated.niveauObtenu, rges: updated.rges } : qq) } : pr));
                      } catch {
                        toast("Erreur lors de la sauvegarde");
                      }
                    };

                    const toggleRGE = async (code: string) => {
                      const newCodes = selectedCodes.includes(code)
                        ? selectedCodes.filter((c) => c !== code)
                        : [...selectedCodes, code];
                      // Optimistic update
                      const previousRges = q.rges || [];
                      setProjets((prev) => prev.map((pr) => pr.id === p.id ? {
                        ...pr,
                        qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? {
                          ...qq,
                          rges: newCodes.map((c) => ({ id: "tmp-" + c, rgeCode: c })),
                        } : qq),
                      } : pr));
                      if (isDemoMode) return;
                      try {
                        const res = await fetch(`/api/qualifications/${qualifId}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ rges: newCodes }),
                        });
                        if (!res.ok) throw new Error("Erreur API");
                        const updated = await res.json();
                        setProjets((prev) => prev.map((pr) => pr.id === p.id ? {
                          ...pr,
                          qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, rges: updated.rges } : qq),
                        } : pr));
                      } catch {
                        // Rollback
                        setProjets((prev) => prev.map((pr) => pr.id === p.id ? {
                          ...pr,
                          qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, rges: previousRges } : qq),
                        } : pr));
                        toast("Erreur lors de la sauvegarde du RGE");
                      }
                    };

                    return (
                      <div key={qualifId} style={{ marginTop: 10, marginLeft: 28, padding: "10px 12px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, marginBottom: 8 }}>
                          {q.type}{nomenclatureMap[q.type] ? ` — ${nomenclatureMap[q.type]}` : ""}
                        </div>
                        {/* RGE picker */}
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>RGE associés</div>
                          <RGEPicker
                            C={C}
                            options={nomenclatureRGE}
                            selected={selectedCodes}
                            onToggle={toggleRGE}
                          />
                        </div>
                        {/* Niveaux */}
                        <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Niveau visé</label>
                            <select
                              value={q.niveauVise || ""}
                              onChange={(e) => updateQualif({ niveauVise: e.target.value || null })}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, boxSizing: "border-box" }}
                            >
                              <option value="">-- Choisir --</option>
                              <option value="PROB">PROB</option>
                              <option value="PLEINE">PLEINE</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Niveau obtenu</label>
                            <select
                              value={q.niveauObtenu || ""}
                              onChange={(e) => updateQualif({ niveauObtenu: e.target.value || null })}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, boxSizing: "border-box" }}
                            >
                              <option value="">-- Choisir --</option>
                              <option value="PROB">PROB</option>
                              <option value="PLEINE">PLEINE</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bons de commande */}
                  {bons.length > 0 && (
                    <div style={{ marginTop: 10, marginLeft: 28 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 6 }}>Bons de commande</div>
                      {bons.map((b) => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 12, borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ color: C.textDim }}>{b.qualificationCode}</span>
                          <span style={{ color: C.text, fontWeight: 500, flex: 1 }}>{b.reference || "—"}</span>
                          {b.montant != null && <span style={{ color: C.text }}>{b.montant.toFixed(2)} €</span>}
                          <Badge color={b.paye ? "#16a34a" : "#ef4444"} bg={b.paye ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)"}>
                            {b.paye ? "Payé" : "Non payé"}
                          </Badge>
                          {b.paye && b.datePaiement && <span style={{ fontSize: 10, color: C.textDim }}>{new Date(b.datePaiement).toLocaleDateString("fr-FR")}</span>}
                          {!b.paye && (
                            <button onClick={async () => {
                              await fetch(`/api/bons-de-commande/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paye: true }) });
                              setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, bonsDeCommande: (pr.bonsDeCommande || []).map((x: BonDeCommande) => x.id === b.id ? { ...x, paye: true, datePaiement: new Date().toISOString() } : x) } : pr));
                              toast("Bon marqué comme payé");
                            }} style={{ padding: "2px 8px", borderRadius: 4, border: "none", background: C.accentDim, color: C.accentText, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                              Marquer payé
                            </button>
                          )}
                          <button onClick={async () => {
                            await fetch(`/api/bons-de-commande/${b.id}`, { method: "DELETE" });
                            setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, bonsDeCommande: (pr.bonsDeCommande || []).filter((x: BonDeCommande) => x.id !== b.id) } : pr));
                          }} style={{ padding: 2, background: "none", border: "none", cursor: "pointer" }}>
                            <Trash2 size={11} color={C.textDim} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add bon de commande */}
                  <div style={{ marginTop: 6, marginLeft: 28 }}>
                    {showAddBon === p.id ? (
                      <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 6 }}>
                        <select value={newBonForm.qualificationCode} onChange={(e) => setNewBonForm({ ...newBonForm, qualificationCode: e.target.value })}
                          style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11 }}>
                          <option value="">Qualification...</option>
                          {p.qualifications.map((q) => <option key={q.type} value={q.type}>{q.type}</option>)}
                        </select>
                        <input placeholder="Référence" value={newBonForm.reference} onChange={(e) => setNewBonForm({ ...newBonForm, reference: e.target.value })}
                          style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11 }} />
                        <input placeholder="Montant (€)" type="number" value={newBonForm.montant} onChange={(e) => setNewBonForm({ ...newBonForm, montant: e.target.value })}
                          style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11 }} />
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={async () => {
                            if (!newBonForm.qualificationCode) return;
                            const res = await fetch("/api/bons-de-commande", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projetId: p.id, ...newBonForm, montant: newBonForm.montant ? Number(newBonForm.montant) : null }) });
                            if (res.ok) {
                              const bon = await res.json();
                              setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, bonsDeCommande: [bon, ...(pr.bonsDeCommande || [])] } : pr));
                              setShowAddBon(null); setNewBonForm({ qualificationCode: "", reference: "", montant: "", dateEmission: "" }); toast("Bon de commande créé");
                            }
                          }} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Ajouter</button>
                          <button onClick={() => setShowAddBon(null)} style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 10, cursor: "pointer" }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setShowAddBon(p.id); setNewBonForm({ qualificationCode: p.qualifications[0]?.type || "", reference: "", montant: "", dateEmission: "" }); }}
                        style={{ padding: "4px 10px", borderRadius: 6, border: `1px dashed ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer", marginTop: 4 }}>
                        + Bon de commande
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {tab === "docs" && (() => {
        const docsCommuns = docs.filter((d) => d.type !== "SPECIFIQUE");
        const docsSpecifiques = docs.filter((d) => d.type === "SPECIFIQUE");
        const communsRecu = docsCommuns.filter((d) => d.recu).length;
        const communsConformes = docsCommuns.filter((d) => d.conformite === "CONFORME").length;
        const specifiquesRecu = docsSpecifiques.filter((d) => d.recu).length;
        const specifiquesConformes = docsSpecifiques.filter((d) => d.conformite === "CONFORME").length;
        const qualifCode = docsSpecifiques[0]?.qualificationAssociee || projets[0]?.qualifications?.[0]?.type || "";

        const reloadDocs = async () => {
          if (!client?.id || isDemoMode) return;
          const projetId = projets[0]?.id;
          if (!projetId) return;
          await fetch(`/api/projets/${projetId}/generate-docs`, { method: "POST" });
          const r = await fetch(`/api/documents?entrepriseId=${client.id}`);
          if (r.ok) {
            const freshDocs = await r.json();
            setDocs(freshDocs.map((d: { id: string; nom: string; recu: boolean; dateReception: string | null; type?: string; qualificationAssociee?: string | null; conformite?: string | null; notes?: string | null; fichierUrl?: string | null; fichierNom?: string | null }) => ({
              id: d.id, nom: d.nom, recu: d.recu, type: d.type || "TRONC_COMMUN", qualificationAssociee: d.qualificationAssociee || null,
              conformite: d.conformite || null, notes: d.notes || null,
              date: d.dateReception ? new Date(d.dateReception).toLocaleDateString("fr-FR") : null, fichierUrl: d.fichierUrl || null, fichierNom: d.fichierNom || null,
            })));
            toast("Documents mis à jour");
          }
        };

        const renderDocRow = (d: typeof docs[0], globalIdx: number) => (
          <div key={d.id || globalIdx}>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
                borderBottom: (nonConformeDocId === d.id || (d.conformite === "NON_CONFORME" && d.notes)) ? "none" : `1px solid ${C.border}`,
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              onClick={() => toggleDoc(globalIdx)}
            >
              <div
                {...(globalIdx === 0 ? { "data-guide": "doc-checkbox-first" } : {})}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${d.recu ? (d.conformite === "NON_CONFORME" ? "#ef4444" : C.accent) : C.border}`,
                  background: d.recu ? (d.conformite === "NON_CONFORME" ? "#ef4444" : C.accent) : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", flexShrink: 0,
                }}
              >
                {d.recu && <Check size={13} color="#fff" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: d.recu ? C.text : C.textMuted, fontWeight: d.recu ? 500 : 400 }}>
                  {d.nom}
                </span>
                {d.conformite === "NON_CONFORME" && d.notes && (
                  <div style={{ fontSize: 11, color: "#ef4444", fontStyle: "italic", marginTop: 2 }}>{d.notes}</div>
                )}
              </div>
              {d.date && <span style={{ fontSize: 11, color: C.textDim, flexShrink: 0 }}>Reçu le {d.date}</span>}
              {d.fichierUrl && (
                <a href={fixFileUrl(d.fichierUrl)} download={d.fichierNom || d.nom} onClick={(e) => e.stopPropagation()}
                  style={{ padding: "3px 8px", borderRadius: 6, background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <Download size={11} /> Fichier
                </a>
              )}
              {!d.recu && <Badge color={C.warning} bg={C.warningDim}>En attente</Badge>}
              {d.recu && d.conformite === "CONFORME" && (
                <Badge color="#16a34a" bg="rgba(22,163,74,0.1)">Conforme</Badge>
              )}
              {d.recu && d.conformite === "NON_CONFORME" && (
                <Badge color="#ef4444" bg="rgba(239,68,68,0.1)">Non conforme</Badge>
              )}
              {d.recu && !d.conformite && d.id && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { if (d.id) updateConformite(d.id, "CONFORME"); }} title="Conforme" style={{ padding: 3, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
                    <CheckCircle size={14} color="#16a34a" />
                  </button>
                  <button onClick={() => { if (d.id) { setNonConformeDocId(d.id); setNonConformeMotif(""); } }} title="Non conforme" style={{ padding: 3, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
                    <XCircle size={14} color="#ef4444" />
                  </button>
                </div>
              )}
            </div>
            {nonConformeDocId === d.id && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 8px 10px 46px", borderBottom: `1px solid ${C.border}`, background: "rgba(239,68,68,0.04)" }} onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  value={nonConformeMotif}
                  onChange={(e) => setNonConformeMotif(e.target.value)}
                  placeholder="Motif de non-conformité..."
                  onKeyDown={(e) => { if (e.key === "Enter" && d.id) { updateConformite(d.id, "NON_CONFORME", nonConformeMotif); setNonConformeDocId(null); } if (e.key === "Escape") setNonConformeDocId(null); }}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid #ef4444`, background: C.bg, color: C.text, fontSize: 12, outline: "none" }}
                />
                <button onClick={() => { if (d.id) { updateConformite(d.id, "NON_CONFORME", nonConformeMotif); setNonConformeDocId(null); } }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Confirmer
                </button>
                <button onClick={() => setNonConformeDocId(null)}
                  style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            )}
          </div>
        );

        return (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Documents à fournir</h3>
              <span style={{ fontSize: 12, color: C.textDim }}>{docsRecu}/{docs.length} reçus · {docsConformes} conformes</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {docs.length > 0 && (
                <div data-guide="docs-progress">
                  <ProgressBar value={docs.length > 0 ? Math.round((docsRecu / docs.length) * 100) : 0} C={C} />
                </div>
              )}
              {projets.length > 0 && !isDemoMode && (
                <Button C={C} variant="ghost" size="sm" icon={<RefreshCw size={12} />} onClick={reloadDocs}>
                  Régénérer
                </Button>
              )}
            </div>
          </div>

          {/* Section : Documents communs */}
          <div style={{ marginBottom: 12 }}>
            <div
              onClick={() => setExpandedCols((p) => ({ ...p, docsCommuns: p.docsCommuns === false ? true : (p.docsCommuns === undefined ? false : !p.docsCommuns) }))}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", cursor: "pointer", userSelect: "none", borderBottom: `1px solid ${C.border}` }}
            >
              <ChevronRight size={14} color={C.textDim} style={{ transition: "transform 0.2s", transform: expandedCols.docsCommuns === false ? "rotate(0deg)" : "rotate(90deg)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>Documents communs à toutes les qualifications</span>
              <span style={{ fontSize: 11, color: C.textDim, marginRight: 8 }}>{communsRecu}/{docsCommuns.length} · {communsConformes} conf.</span>
              {docsCommuns.length > 0 && <div style={{ width: 80 }}><ProgressBar value={Math.round((communsConformes / docsCommuns.length) * 100)} C={C} /></div>}
            </div>
            {expandedCols.docsCommuns !== false && docsCommuns.map((d) => renderDocRow(d, docs.indexOf(d)))}
          </div>

          {/* Section : Documents spécifiques */}
          <div>
            <div
              onClick={() => setExpandedCols((p) => ({ ...p, docsSpec: p.docsSpec === false ? true : (p.docsSpec === undefined ? false : !p.docsSpec) }))}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", cursor: "pointer", userSelect: "none", borderBottom: `1px solid ${C.border}` }}
            >
              <ChevronRight size={14} color={C.textDim} style={{ transition: "transform 0.2s", transform: expandedCols.docsSpec === false ? "rotate(0deg)" : "rotate(90deg)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>Documents spécifiques{qualifCode ? ` à la qualification ${qualifCode}` : ""}</span>
              <span style={{ fontSize: 11, color: C.textDim, marginRight: 8 }}>{specifiquesRecu}/{docsSpecifiques.length} · {specifiquesConformes} conf.</span>
              {docsSpecifiques.length > 0 && <div style={{ width: 80 }}><ProgressBar value={Math.round((specifiquesConformes / docsSpecifiques.length) * 100)} C={C} /></div>}
            </div>
            {expandedCols.docsSpec !== false && (
              docsSpecifiques.length > 0
                ? docsSpecifiques.map((d) => renderDocRow(d, docs.indexOf(d)))
                : <div style={{ padding: "12px 22px", fontSize: 12, color: C.textDim, fontStyle: "italic" }}>Aucun document spécifique configuré pour cette qualification.</div>
            )}
          </div>

          {/* Upload status */}
          {uploadMsg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginTop: 12, fontSize: 12, fontWeight: 500,
              background: uploadMsg.type === "success" ? C.accentDim : C.dangerDim,
              color: uploadMsg.type === "success" ? C.accentText : C.danger,
            }}>
              {uploadMsg.msg}
            </div>
          )}

          {/* Upload zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
          <GuideTooltip id="upload" C={C}>
          <div
            data-guide="upload"
            style={{
              marginTop: 16, padding: 24, borderRadius: 12,
              border: `2px dashed ${dragFile ? C.accent : C.border}`,
              background: dragFile ? C.accentDim : C.bg, textAlign: "center",
              transition: "all 0.2s", cursor: uploading ? "wait" : "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragFile(true); }}
            onDragLeave={() => setDragFile(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragFile(false);
              const file = e.dataTransfer.files[0];
              if (file && !uploading) handleFileUpload(file);
            }}
          >
            <Upload size={20} color={dragFile ? C.accent : C.textDim} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: dragFile ? C.accentText : C.textMuted, fontWeight: 500 }}>
              {uploading ? "Upload en cours..." : "Glisser-déposer un fichier ici"}
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
              {uploading ? "" : "ou cliquer pour parcourir — PDF, images, Word, Excel (max 10 Mo)"}
            </div>
          </div>
          </GuideTooltip>
        </div>
        );
      })()}

      {/* Tab: Track */}
      {tab === "track" && (() => {
        const doneCount = tracks.filter((t) => t.done).length;
        const activeStep = tracks.find((t) => t.active);
        const progress = tracks.length > 0 ? Math.round((doneCount / tracks.length) * 100) : 0;
        const isMail = (nom: string) => nom.toLowerCase().includes("mail automatique");

        return (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: C.text }}>
            Feuille de route{entrepriseData?.qualification ? ` — ${entrepriseData.qualification}` : ""}
          </h3>

          {/* Progress header */}
          {tracks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: activeStep ? C.blue : C.textMuted }}>
                  Étape {doneCount + (activeStep ? 1 : 0)}/{tracks.length}
                  {activeStep ? ` — ${activeStep.nom}` : doneCount === tracks.length ? " — Terminé" : ""}
                </span>
                <span style={{ fontSize: 11, color: C.textDim }}>{progress}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: C.border }}>
                <div style={{ height: 4, borderRadius: 2, background: C.accent, width: `${progress}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          {/* Collapsed done steps */}
          {doneCount > 2 && (
            <Button C={C} variant="ghost" onClick={() => setExpandedCols((p) => ({ ...p, trackDone: !p.trackDone }))} style={{
              width: "100%", border: `1px dashed ${C.border}`,
              color: C.textMuted, marginBottom: 12, textAlign: "left",
            }}>
              {expandedCols.trackDone ? "Masquer" : "Voir"} les {doneCount} étapes terminées
            </Button>
          )}

          <div data-guide="track-timeline" style={{ position: "relative" }}>
            {tracks.map((t, i) => {
              // Hide done steps if collapsed (show last done + active + future)
              if (t.done && doneCount > 2 && !expandedCols.trackDone && i < doneCount - 1) return null;

              return (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
                  <div
                    {...(t.active ? { "data-guide": "track-active-step" } : {})}
                    onClick={async () => {
                      if (!t.active && !t.done) return;
                      const newDone = !t.done;
                      setTracks((prev) => {
                        const updated = prev.map((step) =>
                          step.id === t.id ? { ...step, done: newDone, active: !newDone } : step
                        );
                        if (isDemoMode && newDone) {
                          const idx = updated.findIndex((s) => s.id === t.id);
                          if (idx >= 0 && idx + 1 < updated.length) {
                            updated[idx + 1] = { ...updated[idx + 1], active: true };
                          }
                        }
                        return updated;
                      });
                      if (!isDemoMode) {
                        fetch(`/api/etapes/${t.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ terminee: newDone }),
                        }).catch(() => {});
                      }
                      if (newDone) { guide.showSuggestion("etape-terminee"); toast("Étape terminée"); }
                    }}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: t.done ? C.accent : t.active ? C.blue : C.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: t.active ? `0 0 0 4px ${C.blueDim}` : "none",
                      transition: "all 0.3s",
                      cursor: t.active || t.done ? "pointer" : "default",
                    }}
                  >
                    {t.done ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : t.active ? (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.textDim }}>{i + 1}</span>
                    )}
                  </div>
                  {i < tracks.length - 1 && (
                    <div style={{ width: 2, height: 32, background: t.done ? C.accent : C.border, transition: "all 0.3s" }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.done ? C.accentText : t.active ? C.blue : C.textMuted }}>
                      {t.nom}
                    </span>
                    {isMail(t.nom) && <Badge color={C.purple} bg={C.purpleDim}>Mail auto</Badge>}
                    {t.done && <Badge color={C.accentText} bg={C.accentDim}>Fait</Badge>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: t.active ? C.blue : C.textDim }}>
                      {t.delai > 0 ? `${t.delai}j` : "Durée variable"}
                      {t.active && " — En cours"}
                    </span>
                  </div>
                  {t.active && t.delai > 0 && (
                    <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: C.blueDim, fontSize: 11, color: C.blue }}>
                      Délai estimé {t.delai} jours — alerte si dépassement
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* Tab: Historique */}
      {tab === "historique" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Historique d&apos;activité</h3>
          {historique.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucune activité pour cette entreprise</div>
          )}
          {historique.slice(0, 10).map((a, i) => {
            const ActIcon = ACTIVITY_ICONS[a.type] || FileText;
            const actColor = ACTIVITY_COLORS[a.type] || "textDim";
            return (
              <div
                key={i}
                onClick={() => { if (a.id && ["EMAIL", "SMS", "APPEL"].includes(a.type)) setViewingTransmissionId(a.id); }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 8px",
                  borderBottom: `1px solid ${C.border}`,
                  cursor: a.id && ["EMAIL", "SMS", "APPEL"].includes(a.type) ? "pointer" : "default",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (a.id) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: C[(actColor + "Dim") as keyof Theme] as string,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <ActIcon size={14} color={C[actColor as keyof Theme] as string} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {a.message}
                    {a.automatique && <Badge color="#7c3aed" bg="rgba(124,58,237,0.1)">Auto</Badge>}
                    {a.statutEnvoi === "ECHEC" && <Badge color="#ef4444" bg="rgba(239,68,68,0.1)">Échec</Badge>}
                    {a.statutEnvoi === "ENVOYE" && a.automatique && <Badge color="#16a34a" bg="rgba(22,163,74,0.1)">Envoyé</Badge>}
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{a.chargee} · {a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingTransmissionId && (
        <TransmissionDetailModal C={C} transmissionId={viewingTransmissionId} onClose={() => setViewingTransmissionId(null)} />
      )}

      {/* Tab: Contacts */}
      {tab === "contacts" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Contacts</h3>
            <Button C={C} variant="secondary" onClick={() => setShowAddContact(!showAddContact)} icon={<Plus size={12} />} size="sm">
              Ajouter
            </Button>
          </div>

          {showAddContact && (
            <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="Nom *" value={newContact.nom} onChange={(e) => setNewContact({ ...newContact, nom: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Prénom *" value={newContact.prenom} onChange={(e) => setNewContact({ ...newContact, prenom: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Téléphone" value={newContact.telephone} onChange={(e) => setNewContact({ ...newContact, telephone: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Fonction (ex: Gérant)" value={newContact.fonction} onChange={(e) => setNewContact({ ...newContact, fonction: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none", gridColumn: "1 / -1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <Button C={C} variant="ghost" onClick={() => setShowAddContact(false)}>Annuler</Button>
                <Button C={C} variant="primary" onClick={async () => {
                  if (!newContact.nom || !newContact.prenom || !client?.id) return;
                  const res = await fetch("/api/contacts", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newContact, entrepriseId: client.id }),
                  });
                  if (res.ok) {
                    const c = await res.json();
                    setContacts((prev) => [...prev, c]);
                    setNewContact({ nom: "", prenom: "", email: "", telephone: "", fonction: "" });
                    setShowAddContact(false);
                    toast("Contact ajouté");
                  }
                }}>
                  Créer
                </Button>
              </div>
            </div>
          )}

          {contacts.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun contact</div>
          ) : contacts.map((c) => (
            <div key={c.id}>
              {editingContactId === c.id ? (
                <div style={{ padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input placeholder="Nom" value={editContact.nom} onChange={(e) => setEditContact({ ...editContact, nom: e.target.value })}
                      style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none" }} />
                    <input placeholder="Prénom" value={editContact.prenom} onChange={(e) => setEditContact({ ...editContact, prenom: e.target.value })}
                      style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none" }} />
                    <input placeholder="Email" value={editContact.email} onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                      style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none" }} />
                    <input placeholder="Téléphone" value={editContact.telephone} onChange={(e) => setEditContact({ ...editContact, telephone: e.target.value })}
                      style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none" }} />
                    <input placeholder="Fonction" value={editContact.fonction} onChange={(e) => setEditContact({ ...editContact, fonction: e.target.value })}
                      style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", gridColumn: "1 / -1" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                    <Button C={C} variant="ghost" onClick={() => setEditingContactId(null)}>Annuler</Button>
                    <Button C={C} variant="primary" onClick={async () => {
                      if (isDemoMode) { handleDemoAction("Contact modifié"); setContacts((prev) => prev.map((x) => x.id === c.id ? { ...x, nom: editContact.nom, prenom: editContact.prenom, email: editContact.email || null, telephone: editContact.telephone || null, fonction: editContact.fonction || null } : x)); setEditingContactId(null); toast("Contact modifié"); return; }
                      await fetch(`/api/contacts/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editContact) });
                      setContacts((prev) => prev.map((x) => x.id === c.id ? { ...x, nom: editContact.nom, prenom: editContact.prenom, email: editContact.email || null, telephone: editContact.telephone || null, fonction: editContact.fonction || null } : x));
                      setEditingContactId(null);
                      toast("Contact modifié");
                    }}>Enregistrer</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderBottom: `1px solid ${C.border}` }}>
                  <UserCircle size={16} color={C.purple} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatContactName(c, entrepriseData?.nom)}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>
                      {c.fonction || ""}{c.email ? ` · ${c.email}` : ""}{c.telephone ? ` · ${formatPhone(c.telephone)}` : ""}
                    </div>
                  </div>
                  <Button C={C} variant="ghost" size="sm" onClick={() => { setEditingContactId(c.id); setEditContact({ nom: c.nom, prenom: c.prenom, email: c.email || "", telephone: c.telephone || "", fonction: c.fonction || "" }); }}>
                    <Edit3 size={13} />
                  </Button>
                  <Button C={C} variant="danger" size="sm" onClick={async () => {
                    if (!window.confirm("Supprimer ce contact ?")) return;
                    if (isDemoMode) { handleDemoAction("Contact supprimé"); setContacts((prev) => prev.filter((x) => x.id !== c.id)); return; }
                    await fetch(`/api/contacts/${c.id}`, { method: "DELETE" });
                    setContacts((prev) => prev.filter((x) => x.id !== c.id));
                  }}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Tâches */}
      {tab === "taches" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Tâches</h3>
            <Button C={C} variant="secondary" data-guide="btn-nouvelle-tache" onClick={() => setShowAddTache(!showAddTache)} icon={<Plus size={12} />} size="sm">
              Ajouter
            </Button>
          </div>

          {showAddTache && (
            <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
                <input placeholder="Titre de la tâche *" value={newTache.titre} onChange={(e) => setNewTache({ ...newTache, titre: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <select value={newTache.type} onChange={(e) => setNewTache({ ...newTache, type: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }}>
                  <option value="APPEL">Appel</option>
                  <option value="EMAIL">Email</option>
                  <option value="REUNION">Réunion</option>
                  <option value="RELANCE">Relance</option>
                  <option value="SUIVI">Suivi</option>
                  <option value="AUTRE">Autre</option>
                </select>
                <select value={newTache.assigneeId} onChange={(e) => setNewTache({ ...newTache, assigneeId: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }}>
                  <option value="">Assigner à…</option>
                  {mentionUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                  ))}
                </select>
                <input type="date" value={newTache.dateEcheance} onChange={(e) => setNewTache({ ...newTache, dateEcheance: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <Button C={C} variant="ghost" onClick={() => setShowAddTache(false)}>Annuler</Button>
                <Button C={C} variant="primary" onClick={async () => {
                  if (!newTache.titre) return;
                  if (isDemoMode) {
                    handleDemoAction("Tâche créée");
                    const demoAssignee = newTache.assigneeId ? mentionUsers.find((u) => u.id === newTache.assigneeId) : null;
                    setTaches((prev) => [...prev, { id: `demo-tache-${Date.now()}`, titre: newTache.titre, statut: "A_FAIRE", type: newTache.type, dateEcheance: newTache.dateEcheance || null, enRetard: false, assignee: demoAssignee || null }]);
                    setNewTache({ titre: "", type: "AUTRE", dateEcheance: "", assigneeId: "" });
                    setShowAddTache(false);
                    guide.showSuggestion("tache-creee"); toast("Tâche créée");
                    return;
                  }
                  if (!client?.id) return;
                  const res = await fetch("/api/taches", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newTache, entrepriseId: client.id, dateEcheance: newTache.dateEcheance || null, assigneeId: newTache.assigneeId || null }),
                  });
                  if (res.ok) {
                    const t = await res.json();
                    setTaches((prev) => [...prev, t]);
                    setNewTache({ titre: "", type: "AUTRE", dateEcheance: "", assigneeId: "" });
                    setShowAddTache(false);
                    guide.showSuggestion("tache-creee"); toast("Tâche créée");
                  }
                }}>
                  Créer
                </Button>
              </div>
            </div>
          )}

          {taches.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucune tâche</div>
          ) : taches.map((t) => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 8px",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                border: `2px solid ${t.statut === "TERMINEE" ? C.accent : t.enRetard ? C.danger : C.border}`,
                background: t.statut === "TERMINEE" ? C.accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                cursor: "pointer",
              }}
                onClick={async () => {
                  const newStatut = t.statut === "TERMINEE" ? "A_FAIRE" : "TERMINEE";
                  setTaches((prev) => prev.map((task) => task.id === t.id ? { ...task, statut: newStatut } : task));
                  fetch(`/api/taches/${t.id}`, {
                    method: "PATCH", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ statut: newStatut }),
                  }).catch(() => {});
                }}
              >
                {t.statut === "TERMINEE" && <Check size={13} color="#fff" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: t.statut === "TERMINEE" ? C.textDim : C.text,
                  textDecoration: t.statut === "TERMINEE" ? "line-through" : "none",
                }}>
                  {t.titre}
                </div>
                <div style={{ fontSize: 11, color: C.textDim }}>
                  {t.type}
                  {t.assignee ? ` · Assignée à ${t.assignee.prenom} ${t.assignee.nom}` : ""}
                  {t.dateEcheance ? ` · Échéance : ${new Date(t.dateEcheance).toLocaleDateString("fr-FR")}` : ""}
                  {t.enRetard && <span style={{ color: C.danger, fontWeight: 600 }}> · En retard</span>}
                </div>
              </div>
              <Button C={C} variant="danger" size="sm" onClick={async (e) => {
                e?.stopPropagation();
                if (!window.confirm("Supprimer cette tâche ?")) return;
                await fetch(`/api/taches/${t.id}`, { method: "DELETE" });
                setTaches((prev) => prev.filter((x) => x.id !== t.id));
              }}>
                <Trash2 size={13} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Notes */}
      {tab === "notes" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Notes internes</h3>

          {/* New note form */}
          <div style={{ marginBottom: 20, position: "relative" }}>
            <textarea
              ref={noteTextareaRef}
              placeholder="Ajouter une note... (tapez @ pour mentionner)"
              value={newNote}
              onChange={(e) => {
                setNewNote(e.target.value);
                const pos = e.target.selectionStart || 0;
                const textBefore = e.target.value.slice(0, pos);
                const atMatch = textBefore.match(/@(\w*)$/);
                if (atMatch) {
                  setShowMentionMenu(true);
                  setMentionFilter(atMatch[1].toLowerCase());
                  setMentionCursorPos(pos);
                } else {
                  setShowMentionMenu(false);
                }
              }}
              onKeyDown={(e) => { if (showMentionMenu && e.key === "Escape") setShowMentionMenu(false); }}
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.bg, color: C.text,
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
            {/* Mention dropdown */}
            {showMentionMenu && (
              <div className="dropdown-menu" style={{
                position: "absolute", zIndex: 50, background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                boxShadow: C.shadowHover, maxHeight: 160, overflowY: "auto",
                width: 200, maxWidth: "calc(100vw - 32px)", bottom: "100%", marginBottom: 4,
              }}>
                {mentionUsers
                  .filter((u) => u.prenom.toLowerCase().includes(mentionFilter) || u.nom.toLowerCase().includes(mentionFilter))
                  .map((u) => (
                    <button key={u.id} onClick={() => {
                      const before = newNote.slice(0, mentionCursorPos - mentionFilter.length - 1);
                      const after = newNote.slice(mentionCursorPos);
                      setNewNote(`${before}@${u.prenom} ${after}`);
                      setShowMentionMenu(false);
                      noteTextareaRef.current?.focus();
                    }} style={{
                      width: "100%", padding: "8px 12px", border: "none",
                      background: "transparent", cursor: "pointer", textAlign: "left",
                      fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 8,
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#fff",
                      }}>
                        {u.prenom[0]}{u.nom[0]}
                      </div>
                      {u.prenom} {u.nom}
                    </button>
                  ))
                }
                {mentionUsers.filter((u) => u.prenom.toLowerCase().includes(mentionFilter) || u.nom.toLowerCase().includes(mentionFilter)).length === 0 && (
                  <div style={{ padding: "8px 12px", fontSize: 12, color: C.textDim }}>Aucun utilisateur</div>
                )}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{
                  padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                  background: "transparent", cursor: "pointer", fontSize: 12, color: C.textMuted,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Paperclip size={13} />
                  {noteFile ? noteFile.name : "Joindre"}
                  <input type="file" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 10 * 1024 * 1024) { alert("Fichier trop volumineux (max 10 Mo)"); return; }
                    setNoteFile(file || null);
                  }} />
                </label>
                {noteFile && (
                  <Button C={C} variant="ghost" size="sm" onClick={() => setNoteFile(null)} style={{ color: C.textDim }}>
                    <X size={12} />
                  </Button>
                )}
              </div>
              <Button
                C={C}
                variant="primary"
                disabled={!newNote.trim() && !noteFile}
                icon={<StickyNote size={13} />}
                onClick={async () => {
                  if (!newNote.trim() && !noteFile) return;
                  if (isDemoMode) {
                    handleDemoAction("Note ajoutée");
                    setNotes((prev) => [{ id: `demo-note-${Date.now()}`, contenu: newNote || `[Pièce jointe : ${noteFile?.name}]`, epinglee: false, createdAt: new Date().toISOString(), auteur: { id: "demo", prenom: "Vous", nom: "" } }, ...prev]);
                    setNewNote(""); setNoteFile(null);
                    guide.showSuggestion("note-ajoutee"); toast("Note ajoutée");
                    return;
                  }
                  if (!client?.id) return;
                  let fichierUrl = null;
                  let fichierNom = null;
                  let fichierTaille = null;
                  if (noteFile) {
                    const formData = new FormData();
                    formData.append("file", noteFile);
                    formData.append("entrepriseId", client.id);
                    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                    if (uploadRes.ok) {
                      const uploadData = await uploadRes.json();
                      fichierUrl = uploadData.url;
                      fichierNom = noteFile.name;
                      fichierTaille = noteFile.size;
                    }
                  }
                  const res = await fetch("/api/notes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contenu: newNote || `[Pièce jointe : ${fichierNom}]`,
                      entrepriseId: client.id,
                      fichierUrl, fichierNom, fichierTaille,
                    }),
                  });
                  if (res.ok) {
                    const note = await res.json();
                    setNotes((prev) => [note, ...prev]);
                    setNewNote(""); setNoteFile(null);
                    guide.showSuggestion("note-ajoutee"); toast("Note ajoutée");
                  }
                }}
                style={{
                  background: (newNote.trim() || noteFile) ? "linear-gradient(135deg, #16a34a, #15803d)" : "#94a3b8",
                }}
              >
                Ajouter
              </Button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>
              Aucune note pour cette entreprise
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: note.epinglee ? C.warningDim : C.bg,
                    border: `1px solid ${note.epinglee ? "rgba(217,119,6,0.2)" : C.border}`,
                    position: "relative",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {note.epinglee && <Pin size={12} color={C.warning} />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                        {note.auteur.prenom} {note.auteur.nom}
                      </span>
                      <span style={{ fontSize: 11, color: C.textDim }}>
                        · {new Date(note.createdAt).toLocaleDateString("fr-FR")}{" "}
                        {new Date(note.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {/* Pin toggle */}
                      <Button
                        C={C}
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const res = await fetch("/api/notes", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: note.id, epinglee: !note.epinglee }),
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setNotes((prev) =>
                              prev.map((n) => (n.id === updated.id ? updated : n))
                                .sort((a, b) => (a.epinglee === b.epinglee ? 0 : a.epinglee ? -1 : 1))
                            );
                          }
                        }}
                        style={{ width: 26, height: 26 }}
                        title={note.epinglee ? "Désépingler" : "Épingler"}
                      >
                        <Pin size={13} color={note.epinglee ? C.warning : C.textDim} />
                      </Button>
                      {/* Edit */}
                      <Button
                        C={C}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (editingNote === note.id) {
                            setEditingNote(null);
                          } else {
                            setEditingNote(note.id);
                            setEditContent(note.contenu);
                          }
                        }}
                        style={{ width: 26, height: 26 }}
                        title="Modifier"
                      >
                        <Edit3 size={13} color={C.textDim} />
                      </Button>
                      {/* Delete */}
                      <Button
                        C={C}
                        variant="danger"
                        size="sm"
                        onClick={async () => {
                          if (!window.confirm("Supprimer cette note ?")) return;
                          const res = await fetch(`/api/notes?id=${note.id}`, { method: "DELETE" });
                          if (res.ok) {
                            setNotes((prev) => prev.filter((n) => n.id !== note.id));
                          }
                        }}
                        style={{ width: 26, height: 26 }}
                        title="Supprimer"
                      >
                        <Trash2 size={13} color={C.textDim} />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  {editingNote === note.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 8,
                          border: `1px solid ${C.border}`, background: C.surface, color: C.text,
                          fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <Button
                          C={C}
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            const res = await fetch("/api/notes", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: note.id, contenu: editContent }),
                            });
                            if (res.ok) {
                              const updated = await res.json();
                              setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                              setEditingNote(null);
                            }
                          }}
                        >
                          Enregistrer
                        </Button>
                        <Button
                          C={C}
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNote(null)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {note.contenu.split(/(@\w+)/g).map((part, pi) =>
                          part.startsWith("@")
                            ? <span key={pi} style={{ color: C.accent, fontWeight: 600, background: C.accentDim, padding: "0 4px", borderRadius: 4 }}>{part}</span>
                            : part
                        )}
                      </div>
                      {note.fichierUrl && (
                        <a href={fixFileUrl(note.fichierUrl)} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          marginTop: 8, padding: "6px 10px", borderRadius: 6,
                          background: C.bg, border: `1px solid ${C.border}`,
                          fontSize: 12, color: C.blue, textDecoration: "none",
                        }}>
                          <Paperclip size={12} />
                          {note.fichierNom || "Pièce jointe"}
                          {note.fichierTaille && (
                            <span style={{ color: C.textDim }}>
                              ({(note.fichierTaille / 1024).toFixed(0)} Ko)
                            </span>
                          )}
                        </a>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ========================
// FORMAT HELPERS
// ========================

function formatStatutPrise(statut?: string): string {
  const map: Record<string, string> = {
    NOUVEAU: "Nouveau",
    PRISE_EN_CHARGE: "Prise en charge faite",
    PRISE_EN_CHARGE_A_RELANCER: "À relancer",
  };
  return map[statut || ""] || "Prise en charge faite";
}

function formatInteretTNK(interet?: string): string {
  const map: Record<string, string> = { OUI: "Oui", NON: "Non", NSP: "NSP" };
  return map[interet || ""] || "Oui";
}

function formatStatutFacturation(statut?: string): string {
  const map: Record<string, string> = {
    DEVIS_A_FAIRE: "Devis à faire",
    DEVIS_ENVOYE: "Devis envoyé",
    DEVIS_SIGNE: "Devis signé",
    FACTURE_ENVOYEE: "Facture envoyée",
    FACTURE_PAYEE: "Facture payée",
    DOSSIER_DEPOSE: "Dossier déposé",
    DOSSIER_COMPLEMENT: "Demande complément",
    QUALIFIE: "Qualifié",
    REFUSE: "Refusé",
    DOSSIER_EN_APPEL: "En appel",
  };
  return map[statut || ""] || "—";
}

function RGEPicker({
  C, options, selected, onToggle,
}: {
  C: Theme;
  options: Array<{ code: string; nom: string }>;
  selected: string[];
  onToggle: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4,
        minHeight: 32, padding: "4px 6px", borderRadius: 6,
        border: `1px solid ${C.border}`, background: C.surface,
      }}>
        {selected.length === 0 && (
          <span style={{ fontSize: 11, color: C.textDim, padding: "0 4px" }}>Aucun RGE sélectionné</span>
        )}
        {selected.map((code) => {
          const opt = options.find((o) => o.code === code);
          return (
            <span key={code} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 6px 2px 8px", borderRadius: 4,
              background: "rgba(22,163,74,0.1)", color: "#16a34a",
              fontSize: 11, fontWeight: 600,
            }}>
              {code}{opt ? ` - ${opt.nom.slice(0, 30)}${opt.nom.length > 30 ? "…" : ""}` : ""}
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(code); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                title="Retirer"
              >
                <X size={11} color="#16a34a" />
              </button>
            </span>
          );
        })}
        <button
          onClick={() => setOpen(!open)}
          style={{
            marginLeft: "auto", padding: "2px 8px", borderRadius: 4,
            border: `1px solid ${C.border}`, background: C.bg, color: C.blue,
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 3,
          }}
        >
          <Plus size={11} /> Ajouter
        </button>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: C.shadowHover, maxHeight: 240, overflowY: "auto",
        }}>
          {options.map((r) => {
            const checked = selected.includes(r.code);
            return (
              <div key={r.code}
                onClick={(e) => { e.stopPropagation(); onToggle(r.code); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                  cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                  background: checked ? "rgba(22,163,74,0.06)" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = checked ? "rgba(22,163,74,0.06)" : "transparent"; }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: `2px solid ${checked ? "#16a34a" : C.border}`,
                  background: checked ? "#16a34a" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {checked && <Check size={9} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 11, color: C.text, fontWeight: checked ? 600 : 400 }}>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>{r.code}</span> - {r.nom}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
}

function formatMiseEnRelation(val?: string): string {
  const map: Record<string, string> = {
    SANS_OBJET: "Sans objet",
    APEE: "APEE",
    CEEF: "CEEF",
    HORMEE: "HORMEE",
    FORMATION_RENOPERF: "Formation Renoperf",
    AUTRE: "Autre",
  };
  return map[val || ""] || "—";
}
