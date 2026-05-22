"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail, MessageSquare, Phone, Building2, FileText, FolderOpen,
  ClipboardList, RefreshCw, ChevronRight, X, Send, Upload, Check,
  Calendar, UserCircle, Zap, StickyNote, Pin, Trash2, Edit3, Plus, Download, Paperclip, Handshake, CheckCircle, XCircle, Circle, Clock, Pencil, RotateCcw, Quote,
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
import { getSignature } from "@/lib/mail-signature";

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
  role?: string;
}

export function ClientDetailView({ C, client, onBack, role }: ClientDetailViewProps) {
  const isAdmin = role === "ADMIN";
  const isChargee = role === "CHARGEE";
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const guide = useGuide();
  const { toast } = useToast();
  const isDemoMode = client?.isDemo || checkIsDemo(client || {});
  const [docs, setDocs] = useState<(DocCheck & { id?: string })[]>([]);
  const [tracks, setTracks] = useState<TrackStep[]>([]);
  const [entrepriseData, setEntrepriseData] = useState<Record<string, string> | null>(null);
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailTo, setMailTo] = useState("");
  const [mailToMode, setMailToMode] = useState<"contact" | "autre">("contact");
  const [mailToContactIdx, setMailToContactIdx] = useState(0);
  const [mailCc, setMailCc] = useState("");
  const [mailBcc, setMailBcc] = useState("");
  const [sending, setSending] = useState(false);
  const [mailAttachments, setMailAttachments] = useState<File[]>([]);
  const [mailPreview, setMailPreview] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsBody, setSmsBody] = useState("");
  const [notes, setNotes] = useState<Array<{
    id: string; contenu: string; epinglee: boolean; createdAt: string;
    auteur: { id: string; prenom: string; nom: string };
    fichierUrl?: string | null; fichierNom?: string | null; fichierTaille?: number | null;
    fichiers?: Array<{ id: string; url: string; nom: string; taille: number }>;
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
  const [newProjetForm, setNewProjetForm] = useState<{ nom: string; qualifications: Array<{ code: string; nom: string }>; chargeeId: string; certificateurType: string }>({ nom: "", qualifications: [], chargeeId: "", certificateurType: "Qualibat" });
  const [qualifSearch, setQualifSearch] = useState("");
  const [qualifResults, setQualifResults] = useState<Array<{ code: string; nom: string; categorie: string }>>([]);
  const [nomenclatureMap, setNomenclatureMap] = useState<Record<string, string>>({});
  interface BonDeCommande { id: string; qualificationCode: string; reference: string | null; montant: number | null; paye: boolean; datePaiement: string | null; dateEmission: string | null; commentaire: string | null }
  interface ChantierDoc { id: string; nom: string; fichierUrl: string | null; fichierNom: string | null; fichierTaille: number | null }
  interface ChantierData { id: string; numero: number; nom: string | null; description: string | null; devisRecu: boolean; devisFichierUrl: string | null; devisFichierNom: string | null; dateDevis: string | null; factureRecue: boolean; factureFichierUrl: string | null; factureFichierNom: string | null; dateFacture: string | null; attestationRecue: boolean; attestationFichierUrl: string | null; attestationFichierNom: string | null; dateAttestation: string | null; photosRecues: boolean; photosFichierUrl: string | null; photosFichierNom: string | null; datePhotos: string | null; documents: ChantierDoc[] }
  const [projets, setProjets] = useState<Array<{ id: string; nom: string; qualifications: Array<{ id?: string; type: string; niveauVise?: string | null; niveauObtenu?: string | null; rges?: Array<{ id: string; rgeCode: string }>; chantiers?: ChantierData[]; certificateurType?: string | null; emailCertificateur?: string | null; antenneQualibatId?: string | null; identifiantCertificateur?: string | null; motDePasseCertificateur?: string | null; interlocuteurCertificateur?: string | null; dateCommission?: string | null; bonCommandeDemande?: boolean; dateBonCommandeDemande?: string | null; bonCommandePaye?: boolean; dateBonCommandePaye?: string | null; bonCommandeFichierUrl?: string | null; bonCommandeFichierNom?: string | null; bonsCommandeFichiers?: Array<{ id: string; url: string; nom: string; taille?: number | null; type?: string | null }> }>; etapes: Array<{ terminee: boolean; active: boolean; nom: string }>; bonsDeCommande?: BonDeCommande[]; chargee?: { id: string; prenom: string; nom: string } | null }>>([]);
  const [nomenclatureRGE, setNomenclatureRGE] = useState<Array<{ code: string; nom: string }>>([]);
  const [showAddBon, setShowAddBon] = useState<string | null>(null);
  const [newBonForm, setNewBonForm] = useState({ qualificationCode: "", reference: "", montant: "", dateEmission: "" });
  const [antennes, setAntennes] = useState<Array<{ id: string; nom: string; email: string | null; telephone: string | null; delegation: string | null }>>([]);
  const [newTache, setNewTache] = useState<{ titre: string; type: string; dateEcheance: string; assigneeId: string }>({ titre: "", type: "AUTRE", dateEcheance: "", assigneeId: "" });
  const [historique, setHistorique] = useState<Array<{ id?: string; type: string; message: string; chargee: string; time: string; sortDate?: number; automatique?: boolean; statutEnvoi?: string | null }>>([]);
  const [viewingTransmissionId, setViewingTransmissionId] = useState<string | null>(null);
  const [showCallLog, setShowCallLog] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContact, setEditContact] = useState({ nom: "", prenom: "", email: "", telephone: "", fonction: "" });
  const [callNote, setCallNote] = useState("");
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});
  const [expandedProjets, setExpandedProjets] = useState<Record<string, boolean>>({});
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [activeQualifByProjet, setActiveQualifByProjet] = useState<Record<string, string>>({});
  const [addingQualifToProjet, setAddingQualifToProjet] = useState<string | null>(null);
  const [addQualifSearch, setAddQualifSearch] = useState("");
  const [addQualifResults, setAddQualifResults] = useState<Array<{ code: string; nom: string; categorie: string }>>([]);
  const [depotConfigs, setDepotConfigs] = useState<Array<{ id: string; nom: string }>>([]);
  const [apporteurs, setApporteurs] = useState<Array<{ id: string; nom: string; prenom: string | null; structure: string | null }>>([]);
  const [statutsPrise, setStatutsPrise] = useState<Array<{ code: string; nom: string; couleur: string }>>([]);
  const [statutsFacturation, setStatutsFacturation] = useState<Array<{ code: string; nom: string; couleur: string }>>([]);
  const [prescripteurConfigs, setPrescripteurConfigs] = useState<Array<{ id: string; type: string; nom: string }>>([]);
  const [mentionUsers, setMentionUsers] = useState<Array<{ id: string; prenom: string; nom: string; role?: string }>>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [noteFiles, setNoteFiles] = useState<File[]>([]);

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
    setProjets(DEMO_PROJETS.map((p) => ({ id: p.id, nom: p.nom, qualifications: p.qualifications.map((q) => ({ type: q.type })), etapes: p.etapes.map((e) => ({ terminee: e.terminee, active: e.active, nom: e.nom })) })));
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

        // Load real etapes if available (find first projet with etapes)
        const projetWithEtapes = data.projets?.find((p: { etapes?: unknown[] }) => p.etapes && p.etapes.length > 0);
        if (projetWithEtapes?.etapes?.length > 0) {
          setTracks(
            projetWithEtapes.etapes.map((e: { id: string; nom: string; delaiJours: number; terminee: boolean; active: boolean; dateRealisee?: string | null }) => ({
              id: e.id,
              nom: e.nom,
              delai: e.delaiJours || 0,
              done: e.terminee,
              active: e.active,
              dateRealisee: e.dateRealisee || null,
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
          departement: data.departement || "",
          codePostal: data.codePostal || "",
          ville: data.ville || "",
          dejaReferentRGE: data.dejaReferentRGE ? "true" : "false",
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
          depotAutreLibelle: data.depotAutreLibelle || "",
          apporteurId: data.apporteurId || "",
          apporteurNom: data.apporteur ? `${data.apporteur.prenom ? data.apporteur.prenom + " " : ""}${data.apporteur.nom}${data.apporteur.structure ? " (" + data.apporteur.structure + ")" : ""}` : "",
          conseillerNom: data.conseiller ? `${data.conseiller.prenom ? data.conseiller.prenom + " " : ""}${data.conseiller.nom}` : "",
          conseillerEmail: data.conseiller?.email || "",
          conseillerTelephone: data.conseiller?.telephone || "",
          nomConseiller: data.nomConseiller || "",
          prenomConseiller: data.prenomConseiller || "",
          emailConseiller: data.emailConseiller || "",
          telephoneConseiller: data.telephoneConseiller || "",
          chargeeEntrepriseId: data.chargee?.id || "",
          chargeeEntreprisePrenom: data.chargee?.prenom || "",
          chargeeEntrepriseNom: data.chargee?.nom || "",
          dateEnCours: data.dateEnCours || "",
          dateDepose: data.dateDepose || "",
          dateQualifie: data.dateQualifie || "",
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
          chargee: data.chargee?.prenom || firstProjet?.chargee?.prenom || "",
          dateStatutPrise: data.dateStatutPrise || "",
          dateStatutFacturation: data.dateStatutFacturation || "",
          dateInteresseTNK: data.dateInteresseTNK || "",
          dateMiseEnRelation: data.dateMiseEnRelation || "",
          dateQualification: data.dateQualification || "",
          archive: data.archive ? "true" : "false",
          eligible: data.eligible || "",
          eligibleCommentaire: data.eligibleCommentaire || "",
          dateEligible: data.dateEligible || "",
          relanceJoindre1: data.relanceJoindre1 ? "true" : "false",
          dateRelanceJoindre1: data.dateRelanceJoindre1 || "",
          relanceJoindre2: data.relanceJoindre2 ? "true" : "false",
          dateRelanceJoindre2: data.dateRelanceJoindre2 || "",
          relanceJoindre3: data.relanceJoindre3 ? "true" : "false",
          dateRelanceJoindre3: data.dateRelanceJoindre3 || "",
          relanceJoindre4: data.relanceJoindre4 ? "true" : "false",
          dateRelanceJoindre4: data.dateRelanceJoindre4 || "",
          relanceJoindreInjoignable: data.relanceJoindreInjoignable ? "true" : "false",
          dateRelanceJoindreInjoignable: data.dateRelanceJoindreInjoignable || "",
          relanceDevis1: data.relanceDevis1 ? "true" : "false",
          dateRelanceDevis1: data.dateRelanceDevis1 || "",
          relanceDevis2: data.relanceDevis2 ? "true" : "false",
          dateRelanceDevis2: data.dateRelanceDevis2 || "",
          relanceDevis3: data.relanceDevis3 ? "true" : "false",
          dateRelanceDevis3: data.dateRelanceDevis3 || "",
          relanceDevis4: data.relanceDevis4 ? "true" : "false",
          dateRelanceDevis4: data.dateRelanceDevis4 || "",
          relanceDevisFerme: data.relanceDevisFerme ? "true" : "false",
          dateRelanceDevisFerme: data.dateRelanceDevisFerme || "",
          commentaire: data.commentaire || "",
          relancesCommentaire: data.relancesCommentaire || "",
          alerteAbandonCommentaire: data.alerteAbandonCommentaire || "",
          createdAt: data.createdAt || "",
          dateNouveauOverride: data.dateNouveauOverride || "",
          leadSourceCustomFields: data.leadSource?.customFields || null,
          leadSourceChampsConfig: JSON.stringify(data.leadSource?.champsConfig || []),
          leadSourceCommentaires: data.leadSource?.commentaires || null,
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
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.id) setCurrentUserId(data.id); })
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

    fetch("/api/prescripteur-config")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPrescripteurConfigs(Array.isArray(data) ? data.filter((p: { actif?: boolean }) => p.actif) : []))
      .catch(() => {});

    fetch("/api/apporteurs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setApporteurs(data))
      .catch(() => {});

    fetch("/api/antennes-qualibat")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAntennes(data))
      .catch(() => {});

    fetch("/api/pipeline-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { statutsPrise?: Array<{ code: string; nom: string; couleur: string; actif: boolean }>; statutsFacturation?: Array<{ code: string; nom: string; couleur: string; actif: boolean }> } | null) => {
        if (data?.statutsPrise) setStatutsPrise(data.statutsPrise.filter((s) => s.actif));
        if (data?.statutsFacturation) setStatutsFacturation(data.statutsFacturation.filter((s) => s.actif));
      })
      .catch(() => {});

    // Fetch transmissions + notes as historique
    Promise.all([
      fetch(`/api/transmissions?entrepriseId=${client.id}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/notes?entrepriseId=${client.id}`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([transmissions, notes]: [
      Array<{ id: string; canal: string; objet: string | null; destinataire: string; dateEnvoi: string; direction: string; expediteur: { prenom: string; nom: string } | null; expediteurEmail: string | null; automatique?: boolean; statutEnvoi?: string | null }>,
      Array<{ id: string; contenu: string; createdAt: string; auteur: { prenom: string; nom: string } }>,
    ]) => {
      const transmissionItems = transmissions.map((t) => ({
        id: t.id,
        type: t.canal === "EMAIL" ? "EMAIL" : t.canal === "SMS" ? "SMS" : "APPEL",
        message: `${t.canal === "EMAIL" ? "Mail" : t.canal === "SMS" ? "SMS" : "Appel"} ${t.direction === "SORTANT" ? "envoyé" : "reçu"} — ${t.objet || t.destinataire}`,
        chargee: t.expediteur ? `${t.expediteur.prenom}${t.expediteurEmail ? ` (${t.expediteurEmail})` : ""}` : "—",
        time: formatRelativeTime(new Date(t.dateEnvoi)),
        sortDate: new Date(t.dateEnvoi).getTime(),
        automatique: t.automatique || false,
        statutEnvoi: t.statutEnvoi || null,
      }));
      const noteItems = notes.map((n) => ({
        id: undefined as string | undefined,
        type: "NOTE",
        message: `Note : ${n.contenu}`,
        chargee: `${n.auteur.prenom} ${n.auteur.nom}`,
        time: formatRelativeTime(new Date(n.createdAt)),
        sortDate: new Date(n.createdAt).getTime(),
        automatique: false,
        statutEnvoi: null as string | null,
      }));
      const merged = [...transmissionItems, ...noteItems].sort((a, b) => b.sortDate - a.sortDate);
      setHistorique(merged);
    }).catch(() => {});
  }, [client?.id, isDemoMode]);
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
          background: "rgba(234,88,12,0.08)", border: "1px dashed #ea580c",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#ea580c" }}>
            Mode démo — Les actions sont simulées, aucune donnée réelle n&apos;est modifiée
          </span>
          <Button C={C} variant="ghost" onClick={() => onBack()} style={{
            fontSize: 11, color: "#ea580c", textDecoration: "underline",
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
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
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
            { Icon: Mail, label: "Envoyer mail", guide: "btn-mail", onClick: () => { setMailOpen(!mailOpen); setSmsOpen(false); setMailTo(entrepriseData?.email || ""); setMailToMode("contact"); setMailToContactIdx(0); setMailAttachments([]); window.dispatchEvent(new CustomEvent("tenakoe:mail-opened")); } },
            { Icon: MessageSquare, label: "SMS", guide: "btn-sms", onClick: () => { setSmsOpen(!smsOpen); setMailOpen(false); } },
            { Icon: Phone, label: "Appeler", guide: "btn-appeler", onClick: () => { setShowCallLog(true); setMailOpen(false); setSmsOpen(false); } },
          ].map((btn, i) => (
            <Button key={i} C={C} variant="secondary" data-guide={btn.guide} onClick={btn.onClick} icon={<btn.Icon size={14} />} size="sm">
              {btn.label}
            </Button>
          ))}
        </div>
        </GuideTooltip>
        {!isDemoMode && client?.id && isAdmin && (
          <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
            <Button C={C} variant="secondary" size="sm" icon={<FolderOpen size={13} />}
              onClick={async () => {
                const isArchived = entrepriseData?.archive === "true";
                if (!window.confirm(isArchived ? "Désarchiver cette entreprise ?" : "Archiver cette entreprise ?")) return;
                const res = await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archive: !isArchived }) });
                if (res.ok) { setEntrepriseData((prev) => prev ? { ...prev, archive: String(!isArchived) } : prev); toast(isArchived ? "Entreprise désarchivée" : "Entreprise archivée"); }
              }}
            >
              {entrepriseData?.archive === "true" ? "Désarchiver" : "Archiver"}
            </Button>
            <Button C={C} variant="secondary" size="sm" icon={<Trash2 size={13} />}
              onClick={async () => {
                if (!window.confirm(`Supprimer "${entrepriseData?.nom || client.nom}" ?\n\nL'entreprise sera mise en corbeille pendant 30 jours.`)) return;
                const res = await fetch(`/api/entreprises/${client.id}`, { method: "DELETE" });
                if (res.ok) { toast("Entreprise mise en corbeille"); onBack(); }
                else { const data = await res.json(); toast(data.error || "Erreur"); }
              }}
            >
              Supprimer
            </Button>
          </div>
        )}
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
          {/* Destinataire : contact ou autre */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <button type="button" onClick={() => {
                setMailToMode("contact");
                const c = contacts[mailToContactIdx];
                setMailTo(c?.email || entrepriseData?.email || "");
              }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${mailToMode === "contact" ? C.accent : C.border}`, background: mailToMode === "contact" ? C.accentDim : "transparent", color: mailToMode === "contact" ? C.accentText : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {contacts.length > 1 ? "Contact" : "Email du client"}
              </button>
              <button type="button" onClick={() => { setMailToMode("autre"); setMailTo(""); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${mailToMode === "autre" ? C.accent : C.border}`, background: mailToMode === "autre" ? C.accentDim : "transparent", color: mailToMode === "autre" ? C.accentText : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                Autre adresse
              </button>
            </div>
            {mailToMode === "contact" ? (
              contacts.length > 1 ? (
                <select value={mailToContactIdx} onChange={(e) => {
                  const idx = Number(e.target.value);
                  setMailToContactIdx(idx);
                  setMailTo(contacts[idx]?.email || "");
                }} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                  {contacts.filter((c) => c.email).map((c, idx) => (
                    <option key={c.id} value={idx}>{c.prenom} {c.nom}{c.fonction ? ` — ${c.fonction}` : ""} ({c.email})</option>
                  ))}
                  {entrepriseData?.email && !contacts.some((c) => c.email === entrepriseData?.email) && (
                    <option value={-1}>{entrepriseData.email} (entreprise)</option>
                  )}
                </select>
              ) : (
                <div style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }}>
                  {mailTo || "—"}
                </div>
              )
            ) : (
              <input type="email" placeholder="destinataire@exemple.com, autre@test.fr" value={mailTo} onChange={(e) => setMailTo(e.target.value)} autoFocus
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            )}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select data-guide="template-select" style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 12 }}
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
              <label style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 12, color: C.textMuted, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Paperclip size={12} /> {mailAttachments.length > 0 ? `${mailAttachments.length} fichier(s)` : "PJ"}
                <input type="file" multiple style={{ display: "none" }} onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const totalSize = [...mailAttachments, ...files].reduce((s, f) => s + f.size, 0);
                  if (totalSize > 25 * 1024 * 1024) { alert("Taille totale max dépassée (25 Mo)"); return; }
                  setMailAttachments((prev) => [...prev, ...files]);
                  e.target.value = "";
                }} />
              </label>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button type="button" onClick={() => setMailPreview(!mailPreview)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${mailPreview ? C.accent : C.border}`, background: mailPreview ? C.accentDim : "transparent", color: mailPreview ? C.accentText : C.textMuted, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <FileText size={12} /> Aperçu
              </button>
            <Button
              C={C}
              variant="primary"
              data-guide="btn-send-mail"
              disabled={sending || !mailSubject || !mailTo}
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
                  const attachmentsB64: Array<{ filename: string; mimeType: string; content: string }> = [];
                  for (const file of mailAttachments) {
                    const b64 = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
                      reader.readAsDataURL(file);
                    });
                    attachmentsB64.push({ filename: file.name, mimeType: file.type || "application/octet-stream", content: b64 });
                  }
                  const res = await fetch("/api/send-mail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: mailTo || entrepriseData?.email || "",
                      cc: cc || undefined,
                      bcc: bcc || undefined,
                      subject: mailSubject,
                      html: `<p>${mailBody.replace(/\n/g, "<br>")}</p>`,
                      entrepriseId: client?.id,
                      attachments: attachmentsB64.length > 0 ? attachmentsB64 : undefined,
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
                    setMailAttachments([]);
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
          {mailPreview && (
            <div onClick={(e) => { if (e.target === e.currentTarget) setMailPreview(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, width: "100%", maxWidth: 600, maxHeight: "80vh", overflow: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Aperçu du mail</span>
                  <button type="button" onClick={() => setMailPreview(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color="#64748b" /></button>
                </div>
                <div style={{ padding: "16px 20px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 12, fontSize: 12, color: "#64748b" }}>
                    <div><strong>De :</strong> {entrepriseData?.chargeeEntreprisePrenom || "Kiwi"} {entrepriseData?.chargeeEntrepriseNom || ""}</div>
                    <div><strong>À :</strong> {mailTo || "—"}</div>
                    {mailCc && <div><strong>CC :</strong> {mailCc}</div>}
                    <div><strong>Objet :</strong> {mailSubject || "(sans objet)"}</div>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: mailBody ? `<p>${mailBody.replace(/\n/g, "<br>")}</p>` : "<p style='color:#94a3b8'>(corps du message vide)</p>" }} />
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed #e2e8f0", clear: "both", overflow: "hidden" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", marginBottom: 8 }}>— Signature ajoutée automatiquement à l&apos;envoi —</div>
                    <div dangerouslySetInnerHTML={{ __html: (() => {
                      const sig = getSignature({ prenom: entrepriseData?.chargeeEntreprisePrenom || "Kiwi", nom: entrepriseData?.chargeeEntrepriseNom || "", email: "contact@tenakoe.fr" });
                      return mailBody.toLowerCase().includes("cordialement") ? sig.replace(/<tr>\s*<td[^>]*>\s*<span[^>]*>Cordialement[^<]*<\/span>\s*<\/td>\s*<\/tr>/, "") : sig;
                    })() }} />
                  </div>
                  {mailAttachments.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#64748b" }}>
                      <Paperclip size={10} style={{ verticalAlign: -1, marginRight: 4 }} /><strong>Pièces jointes :</strong> {mailAttachments.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} Mo)`).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {mailAttachments.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
              {mailAttachments.map((file, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.textMuted }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Paperclip size={10} /> {file.name} <span style={{ color: C.textDim }}>({(file.size / 1024 / 1024).toFixed(1)} Mo)</span>
                  </span>
                  <button type="button" onClick={() => setMailAttachments((prev) => prev.filter((_, i) => i !== idx))} style={{ border: "none", background: "transparent", color: C.textDim, cursor: "pointer", padding: "2px 4px" }}><X size={11} /></button>
                </div>
              ))}
              <div style={{ fontSize: 10, color: C.textDim, textAlign: "right" }}>Total : {(mailAttachments.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} / 25 Mo</div>
            </div>
          )}
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
                    const data = await res.json();
                    const via = data.provider ? ` via ${data.provider}` : "";
                    setSendStatus({ type: "success", msg: `SMS envoyé${via}` }); toast(`SMS envoyé${via}`);
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
                background: sending ? "#94a3b8" : "linear-gradient(135deg, #ea580c, #c2410c)",
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
              { label: "N° département", key: "departement", value: entrepriseData?.departement || "—", Icon: Building2, required: true },
              { label: "Prescripteur", key: "prescripteur", value: (() => { const code = entrepriseData?.prescripteur || client?.prescripteur; if (!code) return "—"; if (code === "AUTRE") return "Autre (aucun prescripteur)"; const found = prescripteurConfigs.find((p) => p.type === code); return found?.nom || code; })(), Icon: Building2 },
              { label: "Dépôt", key: "depotId", value: entrepriseData?.depotNom === "Autre" && entrepriseData?.depotAutreLibelle ? `Autre — ${entrepriseData.depotAutreLibelle}` : entrepriseData?.depotNom || "—", Icon: Building2 },
              { label: "Apporteur", key: "apporteurId", value: entrepriseData?.apporteurNom || "—", Icon: Handshake },
              { label: "N° carte", key: "numeroCarte", value: entrepriseData?.numeroCarte || "—", Icon: FileText },
            ].map((f, i) => {
              const saveField = async (val: string) => {
                const original = f.value === "\u2014" ? "" : f.value;
                if (val !== original) {
                  setEntrepriseData((prev) => prev ? { ...prev, [f.key]: val } : prev);
                  if (client?.id && !isDemoMode) {
                    await fetch(`/api/entreprises/${client.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ [f.key]: val || null }),
                    });
                  }
                  if (f.key === "departement" && val.trim() && !isDemoMode) {
                    fetch(`/api/departement-qualibat?departement=${encodeURIComponent(val.trim())}`)
                      .then((r) => r.ok ? r.json() : null)
                      .then((mapping: { delegation: string; email: string; telephone: string } | null) => {
                        if (!mapping) return;
                        const emailCity = mapping.email.split("@")[0].replace("agence", "");
                        const matchedAntenne = antennes.find((a) =>
                          a.nom.toLowerCase().includes(emailCity) ||
                          (a.delegation || "").toLowerCase().includes(mapping.delegation.toLowerCase())
                        );
                        setProjets((prev) => prev.map((pr) => ({
                          ...pr,
                          qualifications: pr.qualifications.map((q) => {
                            if (q.certificateurType !== "Qualibat" && q.certificateurType) return q;
                            const patch: Record<string, unknown> = {
                              certificateurType: "Qualibat",
                              emailCertificateur: mapping.email,
                            };
                            if (matchedAntenne) patch.antenneQualibatId = matchedAntenne.id;
                            if (q.id && !isDemoMode) {
                              fetch(`/api/qualifications/${q.id}`, {
                                method: "PATCH", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(patch),
                              }).catch(() => {});
                            }
                            return { ...q, ...patch };
                          }),
                        })));
                        toast(`Certificateur Qualibat pr\u00e9-rempli (${mapping.delegation} \u00b7 ${mapping.email})`);
                      })
                      .catch(() => {});
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
                  if (isChargee && (f.key === "prescripteur" || f.key === "apporteurId")) return;
                  setEditingField(f.key);
                  setEditFieldValue(f.value === "—" ? "" : f.value);
                }}
              >
                <f.Icon size={14} color={C.textDim} />
                <span style={{ fontSize: 12, color: C.textDim, width: 90 }}>{f.label}{(f as { required?: boolean }).required && <span style={{ color: "#ef4444" }}> *</span>}</span>
                {editingField === f.key && f.key === "prescripteur" ? (
                  <select
                    autoFocus
                    value={entrepriseData?.prescripteur || ""}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setEntrepriseData((prev) => prev ? { ...prev, prescripteur: val } : prev);
                      if (client?.id && !isDemoMode) {
                        await fetch(`/api/entreprises/${client.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ prescripteur: val || null }),
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
                    <option value="">Aucun</option>
                    {prescripteurConfigs.map((p) => (
                      <option key={p.id} value={p.type}>{p.nom}</option>
                    ))}
                    <option value="AUTRE">Autre (aucun prescripteur)</option>
                  </select>
                ) : editingField === f.key && f.key === "depotId" ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <select
                    autoFocus
                    value={entrepriseData?.depotId || ""}
                    onChange={async (e) => {
                      const depotId = e.target.value || null;
                      const depotNom = depotConfigs.find((d) => d.id === depotId)?.nom || "";
                      const isAutre = depotNom === "Autre";
                      setEntrepriseData((prev) => prev ? { ...prev, depotId: depotId || "", depotNom, ...(isAutre ? {} : { depotAutreLibelle: "" }) } : prev);
                      if (client?.id && !isDemoMode) {
                        await fetch(`/api/entreprises/${client.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ depotId, ...(isAutre ? {} : { depotAutreLibelle: null }) }),
                        });
                      }
                      if (!isAutre) setEditingField(null);
                    }}
                    style={{
                      width: "100%", padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.accent}`, background: C.bg, color: C.text,
                      fontSize: 13, fontWeight: 500, outline: "none",
                    }}
                  >
                    <option value="">-- Aucun --</option>
                    {depotConfigs.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                  {entrepriseData?.depotNom === "Autre" && (
                    <input
                      autoFocus
                      placeholder="Précisez le nom du dépôt..."
                      value={entrepriseData?.depotAutreLibelle || ""}
                      onChange={(e) => setEntrepriseData((prev) => prev ? { ...prev, depotAutreLibelle: e.target.value } : prev)}
                      onBlur={async () => {
                        if (client?.id && !isDemoMode) {
                          await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ depotAutreLibelle: entrepriseData?.depotAutreLibelle || null }) }).catch(() => {});
                        }
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      style={{ width: "100%", padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.accent}`, background: C.bg, color: C.text, fontSize: 13, outline: "none" }}
                    />
                  )}
                  </div>
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
                ) : editingField === f.key && (f as { multiline?: boolean }).multiline ? (
                  <textarea
                    autoFocus
                    value={editFieldValue}
                    onChange={(e) => setEditFieldValue(e.target.value)}
                    onBlur={() => saveField(editFieldValue)}
                    rows={4}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 6,
                      border: `1px solid ${C.accent}`, background: C.bg, color: C.text,
                      fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", minHeight: 80,
                    }}
                  />
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
                  <>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500, whiteSpace: (f as { multiline?: boolean }).multiline ? "pre-wrap" : "nowrap" }}>{f.value}</span>
                  </>
                )}
                {f.key !== "contact" && editingField !== f.key && <Edit3 size={11} color={C.textDim} style={{ marginLeft: "auto", opacity: 0.5 }} />}
              </div>
              );
            })}
          </div>
          {/* Coordonnées conseiller */}
          {entrepriseData && (
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Coordonnées conseiller prescripteur</h3>
              {[
                { label: "Nom", key: "nomConseiller", value: entrepriseData?.nomConseiller || "—", Icon: UserCircle },
                { label: "Prénom", key: "prenomConseiller", value: entrepriseData?.prenomConseiller || "—", Icon: UserCircle },
                { label: "Email", key: "emailConseiller", value: entrepriseData?.emailConseiller || "—", Icon: Mail },
                { label: "Téléphone", key: "telephoneConseiller", value: entrepriseData?.telephoneConseiller || "—", Icon: Phone },
              ].map((f, i) => (
                <div key={i} className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                  onClick={() => { setEditingField(f.key); setEditFieldValue(f.value === "—" ? "" : f.value); }}
                >
                  <f.Icon size={14} color={C.textDim} />
                  <span style={{ fontSize: 12, color: C.textDim, width: 90 }}>{f.label}</span>
                  {editingField === f.key ? (
                    <input
                      autoFocus
                      value={editFieldValue}
                      onChange={(e) => setEditFieldValue(e.target.value)}
                      onBlur={async () => {
                        const val = editFieldValue;
                        if (val !== (f.value === "—" ? "" : f.value) && client?.id && !isDemoMode) {
                          setEntrepriseData((prev) => prev ? { ...prev, [f.key]: val } : prev);
                          await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [f.key]: val }) });
                        }
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingField(null); }}
                      style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.accent}`, background: C.bg, color: C.text, fontSize: 13, fontWeight: 500, outline: "none" }}
                    />
                  ) : (
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{f.value}</span>
                  )}
                  {editingField !== f.key && <Edit3 size={11} color={C.textDim} style={{ marginLeft: "auto", opacity: 0.5 }} />}
                </div>
              ))}
            </div>
          )}
          {/* Bloc Commentaire libre */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 18, boxShadow: C.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <MessageSquare size={14} color={C.textDim} />
              <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Commentaire</h3>
            </div>
            <textarea
              value={entrepriseData?.commentaire || ""}
              onChange={(e) => setEntrepriseData((prev) => prev ? { ...prev, commentaire: e.target.value } : prev)}
              onBlur={async (e) => {
                if (!client?.id || isDemoMode) return;
                await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentaire: e.target.value }) }).catch(() => {});
              }}
              placeholder="Notes libres sur l'entreprise..."
              rows={5}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", minHeight: 100, boxSizing: "border-box", lineHeight: 1.5 }}
            />
          </div>
          {/* Bloc Commentaire prescripteur */}
          {entrepriseData?.leadSourceCommentaires && (
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 18, boxShadow: C.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Quote size={14} color={C.textDim} />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Commentaire du prescripteur</h3>
                <span style={{ fontSize: 11, color: C.textDim }}>(à la transmission)</span>
              </div>
              <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap", padding: "10px 12px", background: C.bg, borderRadius: 8, borderLeft: `3px solid ${C.accent}`, lineHeight: 1.5 }}>
                {entrepriseData.leadSourceCommentaires}
              </div>
            </div>
          )}
          {/* Bloc Informations complémentaires (champs custom prescripteur) */}
          {(() => {
            if (!entrepriseData?.leadSourceCustomFields) return null;
            let customData: Record<string, string> = {};
            try { customData = JSON.parse(entrepriseData.leadSourceCustomFields); } catch { return null; }
            const keys = Object.keys(customData).filter((k) => { const v = customData[k]; return v !== "" && v !== null && v !== undefined && v !== "false"; });
            if (keys.length === 0) return null;
            let champsConfig: Array<{ key: string; label: string; type: string; options: string | null }> = [];
            try { champsConfig = JSON.parse(entrepriseData.leadSourceChampsConfig || "[]"); } catch { /* ignore */ }
            const getLabel = (key: string) => champsConfig.find((c) => c.key === key)?.label || key;
            const getDisplayValue = (key: string, value: string) => {
              const champ = champsConfig.find((c) => c.key === key);
              if (!champ) return value;
              if (champ.type === "checkbox") return value === "true" ? "Oui" : "Non";
              if (champ.type === "multicheckbox") { try { const arr = JSON.parse(value); return Array.isArray(arr) ? arr.join(", ") : value; } catch { return value; } }
              if (champ.type === "date" && value) { try { return new Date(value).toLocaleDateString("fr-FR"); } catch { return value; } }
              return value;
            };
            return (
              <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 18, boxShadow: C.shadow }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <FileText size={14} color={C.textDim} />
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Informations complémentaires</h3>
                  <span style={{ fontSize: 11, color: C.textDim }}>(saisies par le prescripteur)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 13 }}>
                  {keys.map((key) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: `1px dashed ${C.border}`, gap: 12 }}>
                      <span style={{ color: C.textMuted, fontSize: 12, flexShrink: 0 }}>{getLabel(key)}</span>
                      <span style={{ color: C.text, fontWeight: 500, textAlign: "right", maxWidth: "65%", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{getDisplayValue(key, customData[key])}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {/* BLOC 1 — Statut & Facturation (allégé) */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Statut & Facturation</h3>
            {/* Éligible */}
            <div className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>Éligible</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }}>
                <select
                  value={entrepriseData?.eligible || "A_VERIFIER"}
                  disabled={isChargee}
                  onChange={async (e) => {
                    if (!client?.id || isDemoMode || isChargee) return;
                    const val = e.target.value;
                    setEntrepriseData((prev) => prev ? { ...prev, eligible: val, dateEligible: new Date().toISOString() } : prev);
                    await fetch(`/api/entreprises/${client.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ eligible: val }),
                    }).catch(() => {});
                  }}
                  style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 600 }}
                >
                  <option value="OUI">Oui</option>
                  <option value="NON">Non</option>
                  <option value="A_VERIFIER">À vérifier</option>
                </select>
                <input
                  type="text"
                  placeholder="Commentaire..."
                  defaultValue={entrepriseData?.eligibleCommentaire || ""}
                  onBlur={async (e) => {
                    if (!client?.id || isDemoMode) return;
                    const val = e.target.value;
                    setEntrepriseData((prev) => prev ? { ...prev, eligibleCommentaire: val } : prev);
                    await fetch(`/api/entreprises/${client.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ eligibleCommentaire: val }),
                    }).catch(() => {});
                  }}
                  style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, flex: 1, minWidth: 120, outline: "none" }}
                />
              </div>
              {entrepriseData?.dateEligible && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: C.textDim, whiteSpace: "nowrap" }}>
                  Modifié le
                  <input type="date" value={new Date(entrepriseData.dateEligible).toISOString().slice(0, 10)}
                    onChange={async (e) => {
                      if (!client?.id || isDemoMode) return;
                      const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                      setEntrepriseData((prev) => prev ? { ...prev, dateEligible: val || "" } : prev);
                      await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dateEligible: val }) }).catch(() => {});
                    }}
                    style={{ fontSize: 10, color: C.textDim, background: "transparent", border: "none", borderBottom: `1px dashed ${C.border}`, padding: "1px 2px", cursor: "pointer", fontFamily: "inherit" }}
                  />
                </span>
              )}
            </div>
            {/* Statut du lead */}
            <div className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>Statut du lead</span>
              <div>
                <select
                  value={entrepriseData?.statutPrise || "NOUVEAU"}
                  disabled={isChargee}
                  onChange={async (e) => {
                    if (!client?.id || isDemoMode || isChargee) return;
                    const val = e.target.value;
                    setEntrepriseData((prev) => prev ? { ...prev, statutPrise: val, dateStatutPrise: new Date().toISOString() } : prev);
                    await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statutPrise: val }) }).catch(() => {});
                  }}
                  style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 600 }}
                >
                  {statutsPrise.map((s) => (
                    <option key={s.code} value={s.code}>{s.nom}</option>
                  ))}
                </select>
                {entrepriseData?.dateStatutPrise && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: C.textDim, marginTop: 2 }}>
                    Modifié le
                    <input type="date" value={new Date(entrepriseData.dateStatutPrise).toISOString().slice(0, 10)}
                      onChange={async (e) => {
                        if (!client?.id || isDemoMode) return;
                        const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                        setEntrepriseData((prev) => prev ? { ...prev, dateStatutPrise: val || "" } : prev);
                        await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dateStatutPrise: val }) }).catch(() => {});
                      }}
                      style={{ fontSize: 10, color: C.textDim, background: "transparent", border: "none", borderBottom: `1px dashed ${C.border}`, padding: "1px 2px", cursor: "pointer", fontFamily: "inherit" }}
                    />
                  </div>
                )}
              </div>
            </div>
            {[
              { label: "Intéressé TNK", key: "interesseTNK", dateKey: "dateInteresseTNK", value: formatInteretTNK(entrepriseData?.interesseTNK), raw: entrepriseData?.interesseTNK, options: [{ v: "OUI", l: "Oui" }, { v: "NON", l: "Non" }, { v: "NSP", l: "NSP" }, { v: "INJOIGNABLE", l: "Injoignable — prospect fermé" }] },
            ].map((f, i) => (
              <div key={i} className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
                <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <select
                    value={f.raw || ""}
                    disabled={isChargee}
                    onChange={async (e) => {
                      if (!client?.id || isChargee) return;
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
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: C.textDim, marginTop: 2 }}>
                    Modifié le
                    <input type="date" value={new Date(entrepriseData[f.dateKey]).toISOString().slice(0, 10)}
                      onChange={async (e) => {
                        if (!client?.id || isDemoMode) return;
                        const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                        setEntrepriseData((prev) => prev ? { ...prev, [f.dateKey]: val || "" } : prev);
                        await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [f.dateKey]: val }) }).catch(() => {});
                      }}
                      style={{ fontSize: 10, color: C.textDim, background: "transparent", border: "none", borderBottom: `1px dashed ${C.border}`, padding: "1px 2px", cursor: "pointer", fontFamily: "inherit" }}
                    />
                  </div>
                )}
                </div>
              </div>
            ))}
            {/* Facturation */}
            <div className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>Statut d&apos;avancement</span>
              <div>
                <select
                  value={entrepriseData?.statutFacturation || "SANS_OBJET"}
                  onChange={async (e) => {
                    if (!client?.id || isDemoMode) return;
                    const val = e.target.value;
                    setEntrepriseData((prev) => prev ? { ...prev, statutFacturation: val, dateStatutFacturation: new Date().toISOString() } : prev);
                    await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statutFacturation: val }) }).catch(() => {});
                  }}
                  style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 600 }}
                >
                  {statutsFacturation.map((s) => (
                    <option key={s.code} value={s.code}>{s.nom}</option>
                  ))}
                </select>
                {entrepriseData?.dateStatutFacturation && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: C.textDim, marginTop: 2 }}>
                    Modifié le
                    <input type="date" value={new Date(entrepriseData.dateStatutFacturation).toISOString().slice(0, 10)}
                      onChange={async (e) => {
                        if (!client?.id || isDemoMode) return;
                        const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                        setEntrepriseData((prev) => prev ? { ...prev, dateStatutFacturation: val || "" } : prev);
                        await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dateStatutFacturation: val }) }).catch(() => {});
                        }}
                        style={{ fontSize: 10, color: C.textDim, background: "transparent", border: "none", borderBottom: `1px dashed ${C.border}`, padding: "1px 2px", cursor: "pointer", fontFamily: "inherit" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            {/* Chargée de projet */}
            <div className="info-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140 }}>Chargée de projet</span>
              <select
                value={entrepriseData?.chargeeEntrepriseId || projets[0]?.chargee?.id || ""}
                disabled={isChargee}
                onChange={async (e) => {
                  if (!client?.id || isDemoMode || isChargee) return;
                  const newChargeeId = e.target.value || null;
                  const newChargee = newChargeeId ? mentionUsers.find((u) => u.id === newChargeeId) || null : null;
                  const prevId = entrepriseData?.chargeeEntrepriseId || "";
                  const prevPrenom = entrepriseData?.chargeeEntreprisePrenom || "";
                  const prevNom = entrepriseData?.chargeeEntrepriseNom || "";
                  const prevProjets = projets.map((p) => ({ id: p.id, chargee: p.chargee }));
                  setEntrepriseData((prev) => prev ? { ...prev, chargeeEntrepriseId: newChargee?.id || "", chargeeEntreprisePrenom: newChargee?.prenom || "", chargeeEntrepriseNom: newChargee?.nom || "" } : prev);
                  setProjets((prev) => prev.map((p) => ({ ...p, chargee: newChargee ? { id: newChargee.id, prenom: newChargee.prenom, nom: newChargee.nom } : null })));
                  try {
                    const res = await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chargeeId: newChargeeId }) });
                    if (!res.ok) {
                      setEntrepriseData((prev) => prev ? { ...prev, chargeeEntrepriseId: prevId, chargeeEntreprisePrenom: prevPrenom, chargeeEntrepriseNom: prevNom } : prev);
                      setProjets((prev) => prev.map((p) => { const old = prevProjets.find((pp) => pp.id === p.id); return { ...p, chargee: old?.chargee || p.chargee }; }));
                      const d = await res.json().catch(() => ({})); toast((d as { error?: string }).error || "Erreur");
                    }
                  } catch {
                    setEntrepriseData((prev) => prev ? { ...prev, chargeeEntrepriseId: prevId, chargeeEntreprisePrenom: prevPrenom, chargeeEntrepriseNom: prevNom } : prev);
                    setProjets((prev) => prev.map((p) => { const old = prevProjets.find((pp) => pp.id === p.id); return { ...p, chargee: old?.chargee || p.chargee }; }));
                    toast("Erreur réseau");
                  }
                }}
                style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12 }}
              >
                <option value="">— Non assignée —</option>
                {mentionUsers.filter((u) => u.role === "CHARGEE" || u.role === "ADMIN").map((u) => (
                  <option key={u.id} value={u.id}>{u.prenom}</option>
                ))}
              </select>
            </div>
            {/* Qualifications (all from all projects) */}
            <div className="info-row" style={{ display: "flex", gap: 10, padding: "8px 0" }}>
              <span className="label-statut" style={{ fontSize: 12, color: C.textDim, width: 140, flexShrink: 0, paddingTop: 3 }}>Qualifications</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {projets.flatMap((p) => p.qualifications).length > 0
                  ? projets.flatMap((p) => p.qualifications).map((q) => {
                    const pct = computeQualifProgress(q);
                    const dotColor = progressColor(pct);
                    const rgeNames = (q.rges || []).map((r) => {
                      const match = nomenclatureRGE.find((n) => n.code === r.rgeCode);
                      return match ? `${match.code} - ${match.nom}` : r.rgeCode;
                    });
                    return (
                      <div key={q.type}>
                        <span
                          title={`${pct}% — ${pct < 30 ? "Démarrage" : pct < 70 ? "En cours" : "Presque terminé"}`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "3px 10px", borderRadius: 999,
                            background: C.blueDim, color: C.blue,
                            fontSize: 11, fontWeight: 600,
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                          {q.type}{nomenclatureMap[q.type] ? ` — ${nomenclatureMap[q.type]}` : ""}
                        </span>
                        {rgeNames.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, marginLeft: 20 }}>
                            {rgeNames.map((rge) => (
                              <span
                                key={rge}
                                style={{
                                  padding: "1px 6px", borderRadius: 4,
                                  background: "rgba(245,158,11,0.18)", color: "#b45309",
                                  fontSize: 10, fontWeight: 600,
                                  border: "1px solid rgba(245,158,11,0.4)",
                                }}
                              >
                                {rge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
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

            {/* Synthèse des dates — par projet */}
            {(() => {
              const activeProjets = projets.filter((p) => p.etapes || true);
              if (activeProjets.length > 1) {
                return (
                  <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Synthèse globale</div>
                    <div style={{ fontSize: 12 }}>
                      {activeProjets.map((proj) => {
                        const pStatut = (proj as unknown as { statutPrise?: string }).statutPrise || entrepriseData?.statutPrise || "NOUVEAU";
                        const pFact = (proj as unknown as { statutFacturation?: string }).statutFacturation || entrepriseData?.statutFacturation || "SANS_OBJET";
                        const pDate = (proj as unknown as { dateStatutFacturation?: string }).dateStatutFacturation || (proj as unknown as { dateStatutPrise?: string }).dateStatutPrise;
                        return (
                          <div key={proj.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ color: C.text, fontWeight: 500 }}>{proj.nom}</span>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: C.accentDim, color: C.accentText, fontWeight: 600 }}>
                                {formatStatut(pStatut, statutsPrise)} · {formatStatut(pFact, statutsFacturation)}
                              </span>
                              {pDate && <span style={{ fontSize: 10, color: C.textDim }}>{new Date(pDate).toLocaleDateString("fr-FR")}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            {projets.map((proj) => {
              const pData = proj as unknown as Record<string, string | null | undefined>;
              const projetEtapes = proj.etapes || [];
              const etape17 = projetEtapes.find((t: { nom: string }) => t.nom.toLowerCase().includes("depot") || t.nom.toLowerCase().includes("dépôt"));
              const etape19 = projetEtapes.find((t: { nom: string }) => t.nom.toLowerCase().includes("obtention"));
              const firstActive = projetEtapes.find((t: { active: boolean }) => t.active);
              const dateRows: Array<{ label: string; date: string | undefined | null; apiKey?: string; isEntrepriseField?: boolean }> = [
                { label: "Nouveau", date: entrepriseData?.dateNouveauOverride || entrepriseData?.createdAt, apiKey: "dateNouveauOverride", isEntrepriseField: true },
                { label: "Prise en charge", date: pData.dateStatutPrise, apiKey: "dateStatutPrise" },
                { label: "Payé", date: pData.dateStatutFacturation, apiKey: "dateStatutFacturation" },
                { label: "En cours", date: pData.dateEnCours || (firstActive as unknown as { dateRealisee?: string })?.dateRealisee || null, apiKey: "dateEnCours" },
                { label: "Déposé", date: pData.dateDepose || ((etape17 as unknown as { done?: boolean; dateRealisee?: string })?.done ? (etape17 as unknown as { dateRealisee?: string }).dateRealisee : null), apiKey: "dateDepose" },
                { label: "Qualifié", date: pData.dateQualifie || ((etape19 as unknown as { done?: boolean; dateRealisee?: string })?.done ? (etape19 as unknown as { dateRealisee?: string }).dateRealisee : null), apiKey: "dateQualifie" },
                { label: "Recours", date: pData.dateRecours, apiKey: "dateRecours" },
                { label: "Refusé", date: pData.dateRefuse, apiKey: "dateRefuse" },
              ];
              return (
                <div key={proj.id} style={{ paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                    {projets.length > 1 ? `Dates — ${proj.nom}` : "Synthèse des dates"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px", fontSize: 12 }}>
                    {dateRows.map((r) => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0" }}>
                        <span style={{ color: C.textMuted }}>{r.label}</span>
                        {r.apiKey && client?.id && !isDemoMode ? (
                          <input
                            type="date"
                            value={r.date ? new Date(r.date).toISOString().slice(0, 10) : ""}
                            onChange={async (e) => {
                              const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                              if (r.isEntrepriseField) {
                                if (!client?.id) return;
                                const prev = entrepriseData?.[r.apiKey!] || "";
                                setEntrepriseData((p) => p ? { ...p, [r.apiKey!]: val || "" } : p);
                                try {
                                  const res = await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [r.apiKey!]: val }) });
                                  if (!res.ok) { setEntrepriseData((p) => p ? { ...p, [r.apiKey!]: prev } : p); const d = await res.json().catch(() => ({})); toast((d as { error?: string }).error || `Erreur ${res.status}`); }
                                } catch { setEntrepriseData((p) => p ? { ...p, [r.apiKey!]: prev } : p); toast("Erreur réseau"); }
                              } else {
                              const previousValue = (proj as unknown as Record<string, string | null>)[r.apiKey!];
                              setProjets((prev) => prev.map((pr) => pr.id === proj.id ? { ...pr, [r.apiKey!]: val || null } as typeof pr : pr));
                              try {
                                const res = await fetch(`/api/projets/${proj.id}`, {
                                  method: "PATCH", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ [r.apiKey!]: val }),
                                });
                                if (!res.ok) {
                                  setProjets((prev) => prev.map((pr) => pr.id === proj.id ? { ...pr, [r.apiKey!]: previousValue ?? null } as typeof pr : pr));
                                  const errData = await res.json().catch(() => ({ error: null }));
                                  toast(errData.error || `Erreur ${res.status}`);
                                }
                              } catch {
                                setProjets((prev) => prev.map((pr) => pr.id === proj.id ? { ...pr, [r.apiKey!]: previousValue ?? null } as typeof pr : pr));
                                toast("Erreur réseau");
                              }
                              }
                            }}
                            style={{
                              padding: "1px 4px", borderRadius: 4, border: `1px solid ${r.date ? "transparent" : C.border}`,
                              background: "transparent", color: r.date ? C.text : C.textDim,
                              fontSize: 12, fontWeight: r.date ? 500 : 400, outline: "none", cursor: "pointer",
                              width: 130, minWidth: 130, textAlign: "right",
                            }}
                          />
                        ) : (
                          <span style={{ color: r.date ? C.text : C.textDim, fontWeight: r.date ? 500 : 400 }}>
                            {r.date ? new Date(r.date).toLocaleDateString("fr-FR") : "—"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formation (unifié) */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Formation</h3>
            {(() => {
              const qualifId = entrepriseData?.qualificationId || projets.flatMap((p) => p.qualifications).find((q) => q.id)?.id || "";
              const toggleFormation = async (key: string) => {
                if (isChargee) return;
                if (!qualifId) { toast("Aucune qualification trouvée pour ce dossier"); return; }
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
                      {renderCheckbox("formationTR", "Transverse")}
                      {renderCheckbox("formationITI", "ITI")}
                      {renderCheckbox("formationITE", "ITE")}
                      {renderCheckbox("formationMenuiserieExt", "Menuiserie Ext")}
                      {renderCheckbox("formationVMC", "VMC")}
                      {renderCheckbox("formationToituresVelux", "Toitures Ext-Velux")}
                      {renderCheckbox("formationToituresTerrasses", "Toitures Terrasses")}
                      {renderCheckbox("formationEmetteursElec", "Émetteurs Élec")}
                      {renderCheckbox("formationChaudiereCogen", "Chaudière cogén")}
                      {renderCheckbox("formationBT", "Bouquet de travaux")}
                      {renderCheckbox("titulaireRenove", "Titulaire RENOVE")}
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

          {/* Relances avant paiement */}
          <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Relances avant paiement</h3>
            {[
              {
                titre: "Relances pour joindre le prospect",
                items: [
                  { key: "relanceJoindre1", dateKey: "dateRelanceJoindre1", label: "Relance 1" },
                  { key: "relanceJoindre2", dateKey: "dateRelanceJoindre2", label: "Relance 2" },
                  { key: "relanceJoindre3", dateKey: "dateRelanceJoindre3", label: "Relance 3" },
                  { key: "relanceJoindre4", dateKey: "dateRelanceJoindre4", label: "Relance 4" },
                  { key: "relanceJoindreInjoignable", dateKey: "dateRelanceJoindreInjoignable", label: "Injoignable — prospect fermé" },
                ],
              },
              {
                titre: "Relances pour signature sur devis envoyé",
                items: [
                  { key: "relanceDevis1", dateKey: "dateRelanceDevis1", label: "Relance 1" },
                  { key: "relanceDevis2", dateKey: "dateRelanceDevis2", label: "Relance 2" },
                  { key: "relanceDevis3", dateKey: "dateRelanceDevis3", label: "Relance 3" },
                  { key: "relanceDevis4", dateKey: "dateRelanceDevis4", label: "Relance 4" },
                  { key: "relanceDevisFerme", dateKey: "dateRelanceDevisFerme", label: "Pas de retour — prospect fermé" },
                ],
              },
            ].map((section) => (
              <div key={section.titre} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{section.titre}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {section.items.map((f) => {
                    const checked = entrepriseData?.[f.key] === "true" || String(entrepriseData?.[f.key]) === "true";
                    const date = entrepriseData?.[f.dateKey];
                    return (
                      <label key={f.key} onClick={async () => {
                        if (!client?.id || isDemoMode) return;
                        const newVal = !checked;
                        setEntrepriseData((prev) => prev ? { ...prev, [f.key]: String(newVal), [f.dateKey]: newVal ? new Date().toISOString() : "" } : prev);
                        await fetch(`/api/entreprises/${client.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ [f.key]: newVal }),
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
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
              <MessageSquare size={14} color={C.textDim} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.textDim, minWidth: 90 }}>Commentaire</span>
              {editingField === "relancesCommentaire" ? (
                <input autoFocus value={editFieldValue} onChange={(e) => setEditFieldValue(e.target.value)}
                  onBlur={async () => {
                    setEntrepriseData((prev) => prev ? { ...prev, relancesCommentaire: editFieldValue } : prev);
                    if (client?.id && !isDemoMode) await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ relancesCommentaire: editFieldValue }) }).catch(() => {});
                    setEditingField(null);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingField(null); }}
                  style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.accent}`, background: C.bg, color: C.text, fontSize: 13, outline: "none" }}
                />
              ) : (
                <span onClick={() => { setEditingField("relancesCommentaire"); setEditFieldValue(entrepriseData?.relancesCommentaire || ""); }}
                  style={{ flex: 1, fontSize: 13, color: entrepriseData?.relancesCommentaire ? C.text : C.textDim, cursor: "pointer", padding: "4px 8px", borderRadius: 6, minHeight: 24 }}>
                  {entrepriseData?.relancesCommentaire || "—"}
                </span>
              )}
            </div>
          </div>

          {/* Procédure alerte avant abandon */}
          <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Alerte abandon prestation payée — le client n&apos;envoie pas les infos</h3>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                <MessageSquare size={14} color={C.textDim} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.textDim, minWidth: 90 }}>Commentaire</span>
                {editingField === "alerteAbandonCommentaire" ? (
                  <input autoFocus value={editFieldValue} onChange={(e) => setEditFieldValue(e.target.value)}
                    onBlur={async () => {
                      setEntrepriseData((prev) => prev ? { ...prev, alerteAbandonCommentaire: editFieldValue } : prev);
                      if (client?.id && !isDemoMode) await fetch(`/api/entreprises/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alerteAbandonCommentaire: editFieldValue }) }).catch(() => {});
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingField(null); }}
                    style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.accent}`, background: C.bg, color: C.text, fontSize: 13, outline: "none" }}
                  />
                ) : (
                  <span onClick={() => { setEditingField("alerteAbandonCommentaire"); setEditFieldValue(entrepriseData?.alerteAbandonCommentaire || ""); }}
                    style={{ flex: 1, fontSize: 13, color: entrepriseData?.alerteAbandonCommentaire ? C.text : C.textDim, cursor: "pointer", padding: "4px 8px", borderRadius: 6, minHeight: 24 }}>
                    {entrepriseData?.alerteAbandonCommentaire || "—"}
                  </span>
                )}
              </div>
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

            {showAddProjet && (() => {
              const isNewQualibat = newProjetForm.certificateurType === "Qualibat";
              return (
              <div style={{ padding: 14, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Certificateur *</label>
                  <select
                    value={newProjetForm.certificateurType}
                    onChange={(e) => setNewProjetForm({ ...newProjetForm, certificateurType: e.target.value, qualifications: [] })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }}
                  >
                    <option value="Qualibat">Qualibat</option>
                    <option value="Qualifelec">Qualifelec</option>
                    <option value="Qualit&apos;EnR">Qualit&apos;EnR</option>
                    <option value="Certibat">Certibat</option>
                  </select>
                </div>
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
                {/* Qualifications: nomenclature search for Qualibat, free text for others */}
                <div style={{ marginBottom: 10 }}>
                  {isNewQualibat ? (
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
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        placeholder="Nom de la qualification (ex: SPV1, PAC...)"
                        value={qualifSearch}
                        onChange={(e) => setQualifSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && qualifSearch.trim()) {
                            e.preventDefault();
                            const code = qualifSearch.trim().toUpperCase().slice(0, 20);
                            if (!newProjetForm.qualifications.some((q) => q.code === code)) {
                              setNewProjetForm({ ...newProjetForm, qualifications: [...newProjetForm.qualifications, { code, nom: qualifSearch.trim() }] });
                            }
                            setQualifSearch("");
                          }
                        }}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none" }}
                      />
                      <Button C={C} variant="secondary" size="sm" disabled={!qualifSearch.trim()} onClick={() => {
                        const code = qualifSearch.trim().toUpperCase().slice(0, 20);
                        if (!newProjetForm.qualifications.some((q) => q.code === code)) {
                          setNewProjetForm({ ...newProjetForm, qualifications: [...newProjetForm.qualifications, { code, nom: qualifSearch.trim() }] });
                        }
                        setQualifSearch("");
                      }}>Ajouter</Button>
                    </div>
                  )}
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
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
                  {newProjetForm.nom && newProjetForm.qualifications.length === 0 && !qualifSearch.trim() && (
                    <span style={{ fontSize: 11, color: C.danger }}>Ajoutez au moins une qualification</span>
                  )}
                  <Button C={C} variant="ghost" onClick={() => {
                    if (newProjetForm.nom || newProjetForm.qualifications.length > 0 || qualifSearch.trim()) {
                      if (!window.confirm("Quitter sans enregistrer ? Vos saisies seront perdues.")) return;
                    }
                    setShowAddProjet(false);
                    setQualifSearch("");
                  }}>Annuler</Button>
                  <Button C={C} variant="primary" disabled={!newProjetForm.nom || (newProjetForm.qualifications.length === 0 && !qualifSearch.trim())} onClick={async () => {
                    // Auto-add pending qualif from search field before creating
                    let finalQualifs = [...newProjetForm.qualifications];
                    if (qualifSearch.trim() && !isNewQualibat) {
                      const code = qualifSearch.trim().toUpperCase().slice(0, 20);
                      if (!finalQualifs.some((q) => q.code === code)) {
                        finalQualifs.push({ code, nom: qualifSearch.trim() });
                      }
                      setQualifSearch("");
                    }
                    if (finalQualifs.length === 0) return;
                    setNewProjetForm({ ...newProjetForm, qualifications: finalQualifs });
                    if (isDemoMode) {
                      handleDemoAction("Projet créé");
                      setProjets((prev) => [...prev, { id: `demo-projet-${Date.now()}`, nom: newProjetForm.nom, qualifications: finalQualifs.map((q) => ({ type: q.code, certificateurType: newProjetForm.certificateurType })), etapes: [] }]);
                      setShowAddProjet(false);
                      setNewProjetForm({ nom: "", qualifications: [], chargeeId: "", certificateurType: "Qualibat" });
                      guide.showSuggestion("nouveau-projet"); toast("Projet créé");
                      return;
                    }
                    if (!client?.id) return;
                    const payload: Record<string, unknown> = { nom: newProjetForm.nom, entrepriseId: client.id, certificateurType: newProjetForm.certificateurType };
                    if (finalQualifs.length > 0) payload.qualifications = finalQualifs.map((q) => ({ type: q.code }));
                    if (newProjetForm.chargeeId) payload.chargeeId = newProjetForm.chargeeId;
                    const res = await fetch("/api/projets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                    if (res.ok) {
                      setShowAddProjet(false);
                      setNewProjetForm({ nom: "", qualifications: [], chargeeId: "", certificateurType: "Qualibat" });
                      guide.showSuggestion("nouveau-projet"); toast("Projet créé");
                      fetch(`/api/entreprises/${client.id}`).then((r) => r.ok ? r.json() : null).then((data) => {
                        if (data?.projets) setProjets(data.projets);
                      }).catch(() => {});
                    }
                  }}>Créer</Button>
                </div>
              </div>
              );
            })()}

            {projets.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun projet</div>
            ) : projets.map((p, projetIdx) => {
              const etapesDone = p.etapes?.filter((e) => e.terminee).length || 0;
              const etapesTotal = p.etapes?.length || 0;
              const bons = (p.bonsDeCommande || []) as BonDeCommande[];
              const isProjetOpen = expandedProjets[p.id] === undefined ? projetIdx === 0 : expandedProjets[p.id];
              const isLastProjet = projetIdx === projets.length - 1;
              return (
                <div
                  key={p.id}
                  style={{
                    borderBottom: isLastProjet ? "none" : `1px solid ${C.border}`,
                  }}
                >
                  <div
                    onClick={() => setExpandedProjets((prev) => ({ ...prev, [p.id]: !isProjetOpen }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 6px", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <ChevronRight
                      size={16}
                      color={C.textDim}
                      style={{ transition: "transform 0.2s", transform: isProjetOpen ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}
                    />
                    <FolderOpen size={16} color={C.textMuted} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.nom}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {p.qualifications.map((q) => (
                          <Badge key={q.type} color={C.blue} bg={C.blueDim}>
                            {q.type}{nomenclatureMap[q.type] ? ` — ${nomenclatureMap[q.type]}` : ""}
                          </Badge>
                        ))}
                        {p.qualifications.length === 0 && <span style={{ fontSize: 11, color: C.textDim }}>Aucune qualification</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.textDim, flexShrink: 0, whiteSpace: "nowrap" }}>
                      {etapesDone}/{etapesTotal} étapes
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Supprimer le projet "${p.nom}" ?\n\nLe projet sera mis en corbeille pendant 30 jours, puis supprimé définitivement.`)) return;
                        const res = await fetch(`/api/projets/${p.id}`, { method: "DELETE" });
                        if (res.ok) {
                          setProjets((prev) => prev.filter((pr) => pr.id !== p.id));
                          toast("Projet mis en corbeille");
                        }
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
                      title="Supprimer LE PROJET ENTIER (toutes ses qualifications)"
                    >
                      <Trash2 size={14} color={C.textDim} />
                    </button>
                  </div>

                  {isProjetOpen && (
                  <div style={{ padding: "4px 6px 14px" }}>
                  {(() => {
                    const qualifs = p.qualifications.filter((q) => q.id);
                    if (qualifs.length === 0 && addingQualifToProjet !== p.id) {
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px" }}>
                          <span style={{ fontSize: 11, color: C.textDim, flex: 1 }}>Aucune qualification.</span>
                          <button
                            onClick={() => { setAddingQualifToProjet(p.id); setAddQualifSearch(""); setAddQualifResults([]); }}
                            style={{ padding: "4px 10px", borderRadius: 6, border: `1px dashed ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer" }}
                          >
                            + Ajouter une qualification
                          </button>
                        </div>
                      );
                    }

                    const activeQualifId = activeQualifByProjet[p.id] && qualifs.find((q) => q.id === activeQualifByProjet[p.id])
                      ? activeQualifByProjet[p.id]
                      : qualifs[0]?.id;
                    const activeQualif = qualifs.find((q) => q.id === activeQualifId);

                    return (
                      <>
                        {/* Tab bar */}
                        <div style={{
                          display: "flex", gap: 2, flexWrap: "wrap",
                          borderBottom: `1px solid ${C.border}`,
                          marginBottom: 0,
                        }}>
                          {qualifs.map((q) => {
                            const qPct = computeQualifProgress(q);
                            const dotColor = progressColor(qPct);
                            const isActive = q.id === activeQualifId;
                            const tabLabel = `${q.type}${nomenclatureMap[q.type] ? ` — ${nomenclatureMap[q.type].slice(0, 30)}${nomenclatureMap[q.type].length > 30 ? "…" : ""}` : ""}`;
                            const handleRemoveQualif = async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (qualifs.length === 1) { alert("Impossible de supprimer la dernière qualification. Supprime le projet entier."); return; }
                              if (!window.confirm(`Supprimer la qualification "${q.type}" ?\n\nLes chantiers associés seront aussi supprimés.`)) return;
                              try {
                                const res = await fetch(`/api/projets/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removeQualifications: [q.type] }) });
                                if (!res.ok) throw new Error();
                                const updated = await res.json();
                                setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, qualifications: updated.qualifications } : pr));
                                if (isActive && updated.qualifications.length > 0) setActiveQualifByProjet((prev) => ({ ...prev, [p.id]: updated.qualifications[0].id }));
                                toast("Qualification supprimée");
                              } catch { toast("Erreur lors de la suppression"); }
                            };
                            return (
                              <div key={q.id} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                                onMouseEnter={(e) => { const b = e.currentTarget.querySelector("[data-del-btn]") as HTMLElement | null; if (b) b.style.opacity = "1"; }}
                                onMouseLeave={(e) => { const b = e.currentTarget.querySelector("[data-del-btn]") as HTMLElement | null; if (b) b.style.opacity = "0"; }}
                              >
                                <button
                                  onClick={() => setActiveQualifByProjet((prev) => ({ ...prev, [p.id]: q.id! }))}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "7px 26px 7px 12px", border: "none",
                                    background: isActive ? C.accentDim : "transparent",
                                    color: isActive ? C.accentText : C.textMuted,
                                    fontSize: 11, fontWeight: isActive ? 600 : 500,
                                    cursor: "pointer",
                                    borderBottom: `2px solid ${isActive ? C.accent : "transparent"}`,
                                    marginBottom: -1, borderRadius: "6px 6px 0 0", transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                                  <span>{tabLabel}</span>
                                </button>
                                <button data-del-btn onClick={handleRemoveQualif} title="Supprimer cette qualification"
                                  style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, padding: 0, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, opacity: 0, transition: "opacity 0.15s" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                  <X size={11} color="#ef4444" />
                                </button>
                              </div>
                            );
                          })}
                          <button
                            onClick={() => { setAddingQualifToProjet(p.id); setAddQualifSearch(""); setAddQualifResults([]); }}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "7px 12px", border: "none", background: "transparent",
                              color: C.textDim, fontSize: 11, fontWeight: 500, cursor: "pointer",
                              borderRadius: "6px 6px 0 0",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Plus size={12} /> Ajouter
                          </button>
                        </div>

                        {/* Inline add-qualification picker */}
                        {addingQualifToProjet === p.id && (() => {
                          const existingCert = qualifs.find((q) => q.certificateurType)?.certificateurType || "Qualibat";
                          const isExistingQualibat = existingCert === "Qualibat";
                          const addQualifAction = async (code: string, nom: string) => {
                            setAddingQualifToProjet(null); setAddQualifSearch(""); setAddQualifResults([]);
                            if (isDemoMode) {
                              setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, qualifications: [...pr.qualifications, { id: `demo-q-${Date.now()}`, type: code }] } : pr));
                              return;
                            }
                            try {
                              const res = await fetch(`/api/projets/${p.id}`, {
                                method: "PATCH", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ addQualifications: [{ type: code, certificateurType: existingCert }] }),
                              });
                              if (!res.ok) throw new Error();
                              const updated = await res.json();
                              setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, qualifications: updated.qualifications } : pr));
                              const added = updated.qualifications.find((qq: { type: string; id: string }) => qq.type === code);
                              if (added) setActiveQualifByProjet((prev) => ({ ...prev, [p.id]: added.id }));
                              toast("Qualification ajoutée");
                            } catch { toast("Erreur lors de l'ajout"); }
                          };
                          return (
                          <div style={{ position: "relative", margin: "10px 0 4px" }}>
                            {isExistingQualibat ? (
                              <>
                                <input
                                  autoFocus
                                  placeholder="Code ou nom de la qualification..."
                                  value={addQualifSearch}
                                  onChange={(e) => {
                                    setAddQualifSearch(e.target.value);
                                    if (e.target.value.length >= 2) {
                                      fetch(`/api/nomenclature-qualibat?search=${encodeURIComponent(e.target.value)}`)
                                        .then((r) => r.json()).then(setAddQualifResults).catch(() => {});
                                    } else { setAddQualifResults([]); }
                                  }}
                                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                                />
                                {addQualifResults.length > 0 && (
                                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: C.shadowHover, maxHeight: 240, overflowY: "auto", marginTop: 4 }}>
                                    {addQualifResults.filter((q) => !qualifs.some((qq) => qq.type === q.code)).map((q) => (
                                      <button key={q.code} onClick={() => addQualifAction(q.code, q.nom)}
                                        style={{ width: "100%", padding: "6px 10px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 11, color: C.text, borderBottom: `1px solid ${C.border}` }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                      >
                                        <span style={{ fontWeight: 700, color: C.blue }}>{q.code}</span>
                                        <span style={{ marginLeft: 6 }}>{q.nom}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ display: "flex", gap: 8 }}>
                                <input
                                  autoFocus
                                  placeholder={`Nom de la qualification ${existingCert}...`}
                                  value={addQualifSearch}
                                  onChange={(e) => setAddQualifSearch(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && addQualifSearch.trim()) {
                                      e.preventDefault();
                                      const code = addQualifSearch.trim().toUpperCase().slice(0, 20);
                                      if (!qualifs.some((q) => q.type === code)) addQualifAction(code, addQualifSearch.trim());
                                    }
                                  }}
                                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none" }}
                                />
                                <Button C={C} variant="secondary" size="sm" disabled={!addQualifSearch.trim()} onClick={() => {
                                  const code = addQualifSearch.trim().toUpperCase().slice(0, 20);
                                  if (!qualifs.some((q) => q.type === code)) addQualifAction(code, addQualifSearch.trim());
                                }}>Ajouter</Button>
                              </div>
                            )}
                            <button
                              onClick={() => { setAddingQualifToProjet(null); setAddQualifSearch(""); setAddQualifResults([]); }}
                              style={{ position: "absolute", right: 6, top: 6, padding: 4, border: "none", background: "transparent", cursor: "pointer" }}
                              title="Annuler"
                            >
                              <X size={14} color={C.textDim} />
                            </button>
                          </div>
                          );
                        })()}

                        {/* Active qualification content */}
                        {activeQualif && activeQualif.id && (() => {
                          const q = activeQualif;
                          const qualifId = q.id!;
                          const selectedCodes = (q.rges || []).map((r) => r.rgeCode);
                          const qualifPct = computeQualifProgress(q);
                          const qualifPctColor = progressColor(qualifPct);

                          const updateQualif = async (patch: Record<string, unknown>) => {
                            setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, ...patch } : qq) } : pr));
                            if (isDemoMode) return;
                            try {
                              const res = await fetch(`/api/qualifications/${qualifId}`, {
                                method: "PATCH", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(patch),
                              });
                              if (!res.ok) throw new Error("Erreur API");
                              const updated = await res.json();
                              setProjets((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, ...updated } : qq) } : pr));
                            } catch {
                              toast("Erreur lors de la sauvegarde");
                            }
                          };

                          const toggleRGE = async (code: string) => {
                            const newCodes = selectedCodes.includes(code)
                              ? selectedCodes.filter((c) => c !== code)
                              : [...selectedCodes, code];
                            const previousRges = q.rges || [];
                            setProjets((prev) => prev.map((pr) => pr.id === p.id ? {
                              ...pr,
                              qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, rges: newCodes.map((c) => ({ id: "tmp-" + c, rgeCode: c })) } : qq),
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
                              setProjets((prev) => prev.map((pr) => pr.id === p.id ? {
                                ...pr,
                                qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, rges: previousRges } : qq),
                              } : pr));
                              toast("Erreur lors de la sauvegarde du RGE");
                            }
                          };

                          return (
                            <div style={{ padding: "10px 2px 0" }}>
                              {/* Progress bar */}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${qualifPct}%`,
                                    background: qualifPctColor,
                                    transition: "width 0.4s ease, background 0.3s",
                                  }} />
                                </div>
                                <span style={{ fontSize: 11, color: qualifPctColor, fontWeight: 600, minWidth: 32, textAlign: "right" }}>{qualifPct}%</span>
                              </div>

                              {/* RGE picker */}
                              <div style={{ marginBottom: 10 }}>
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
                                    style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11, boxSizing: "border-box" }}
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
                                    style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11, boxSizing: "border-box" }}
                                  >
                                    <option value="">-- Choisir --</option>
                                    <option value="PROB">PROB</option>
                                    <option value="PLEINE">PLEINE</option>
                                  </select>
                                </div>
                              </div>

                              <QualifCertificateur
                                key={qualifId}
                                C={C}
                                qualif={q}
                                antennes={antennes}
                                updateQualif={updateQualif}
                              />

                              <QualifChantiers
                                C={C}
                                qualificationId={qualifId}
                                chantiers={q.chantiers || []}
                                expandedCols={expandedCols}
                                setExpandedCols={setExpandedCols}
                                isDemoMode={isDemoMode}
                                toast={toast}
                                onUpdate={(newChantiers) => {
                                  setProjets((prev) => prev.map((pr) => pr.id === p.id ? {
                                    ...pr,
                                    qualifications: pr.qualifications.map((qq) => qq.id === qualifId ? { ...qq, chantiers: newChantiers } : qq),
                                  } : pr));
                                }}
                              />
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}

                  </div>
                  )}
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
              {d.recu && d.id && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {d.conformite !== "CONFORME" && (
                    <button onClick={() => { if (d.id) updateConformite(d.id, "CONFORME"); }} title={d.conformite === "NON_CONFORME" ? "Passer en conforme" : "Marquer conforme"} style={{ padding: 3, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
                      <CheckCircle size={14} color="#16a34a" />
                    </button>
                  )}
                  {d.conformite !== "NON_CONFORME" && (
                    <button onClick={() => { if (d.id) { setNonConformeDocId(d.id); setNonConformeMotif(d.notes || ""); } }} title={d.conformite === "CONFORME" ? "Passer en non conforme" : "Marquer non conforme"} style={{ padding: 3, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
                      <XCircle size={14} color="#ef4444" />
                    </button>
                  )}
                  {d.conformite === "NON_CONFORME" && (
                    <button onClick={() => { if (d.id) { setNonConformeDocId(d.id); setNonConformeMotif(d.notes || ""); } }} title="Modifier le motif" style={{ padding: 3, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
                      <Pencil size={14} color={C.textDim} />
                    </button>
                  )}
                  {d.conformite && (
                    <button onClick={() => { if (d.id) updateConformite(d.id, null); }} title="Annuler le statut" style={{ padding: 3, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
                      <RotateCcw size={14} color={C.textDim} />
                    </button>
                  )}
                </div>
              )}
              {d.id && (
                <label
                  onClick={(e) => e.stopPropagation()}
                  title="Uploader un fichier"
                  style={{ padding: 3, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", flexShrink: 0 }}
                >
                  <Upload size={14} color={C.textDim} />
                  <input type="file" style={{ display: "none" }} onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file || !d.id) return;
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    if (res.ok) {
                      const { url } = await res.json();
                      await fetch(`/api/documents/${d.id}`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fichierUrl: url, fichierNom: file.name, recu: true }),
                      });
                      setDocs((prev) => prev.map((doc) => doc.id === d.id ? { ...doc, fichierUrl: url, fichierNom: file.name, recu: true, date: new Date().toLocaleDateString("fr-FR") } : doc));
                      toast(`${d.nom} uploadé`);
                    }
                    ev.target.value = "";
                  }} />
                </label>
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
          {tracks.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>
              Aucune étape. Créez un projet avec une qualification puis générez les documents pour initialiser la feuille de route.
            </div>
          )}
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
                      if (t.done) {
                        if (!window.confirm(`Annuler la validation de l'étape "${t.nom}" ? Le statut du dossier sera recalculé en conséquence.`)) return;
                      }
                      const newDone = !t.done;
                      setTracks((prev) => {
                        const updated = prev.map((step) =>
                          step.id === t.id ? { ...step, done: newDone, active: !newDone } : step
                        );
                        const idx = updated.findIndex((s) => s.id === t.id);
                        if (newDone) {
                          if (idx >= 0 && idx + 1 < updated.length) {
                            updated[idx + 1] = { ...updated[idx + 1], active: true };
                          }
                        } else {
                          if (idx >= 0 && idx + 1 < updated.length) {
                            updated[idx + 1] = { ...updated[idx + 1], active: false };
                          }
                        }
                        return updated;
                      });
                      if (!isDemoMode) {
                        fetch(`/api/etapes/${t.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ terminee: newDone }),
                        }).then((res) => res.ok ? res.json() : null).then((data) => {
                          if (data?.dateRealisee !== undefined) {
                            setTracks((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, dateRealisee: data.dateRealisee } : tr));
                          }
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
                    {t.done && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Badge color={C.accentText} bg={C.accentDim}>Fait{t.dateRealisee ? ` le ${new Date(t.dateRealisee).toLocaleDateString("fr-FR")}` : ""}</Badge>
                        {t.dateRealisee && (
                          <span style={{ position: "relative", display: "inline-flex" }}>
                            <Edit3 size={12} color={C.textDim} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setExpandedCols((prev) => ({ ...prev, [`editDate-${t.id}`]: true })); }} />
                            {expandedCols[`editDate-${t.id}`] && (
                              <input
                                type="date"
                                autoFocus
                                defaultValue={new Date(t.dateRealisee).toISOString().slice(0, 10)}
                                onBlur={async (e) => {
                                  setExpandedCols((prev) => ({ ...prev, [`editDate-${t.id}`]: false }));
                                  const val = e.target.value;
                                  if (!val) return;
                                  const iso = new Date(val).toISOString();
                                  setTracks((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, dateRealisee: iso } : tr));
                                  if (!isDemoMode) {
                                    await fetch(`/api/etapes/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dateRealisee: iso }) }).catch(() => {});
                                  }
                                }}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const iso = new Date(val).toISOString();
                                  setTracks((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, dateRealisee: iso } : tr));
                                  if (!isDemoMode) {
                                    await fetch(`/api/etapes/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dateRealisee: iso }) }).catch(() => {});
                                  }
                                  setExpandedCols((prev) => ({ ...prev, [`editDate-${t.id}`]: false }));
                                }}
                                style={{ position: "absolute", top: -4, left: 16, padding: "2px 4px", borderRadius: 4, border: `1px solid ${C.accent}`, background: C.surface, color: C.text, fontSize: 11, zIndex: 10, outline: "none" }}
                              />
                            )}
                          </span>
                        )}
                      </span>
                    )}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Historique d&apos;activité</h3>
            <Button C={C} variant="primary" size="sm" icon={<StickyNote size={13} />} onClick={() => setShowNoteForm((v) => !v)}>
              Ajouter une note
            </Button>
          </div>

          {/* Inline note form */}
          {showNoteForm && (
            <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, position: "relative" }}>
              <textarea
                ref={noteTextareaRef}
                placeholder="Ajouter une note... (tapez @ pour mentionner)"
                value={newNote}
                onChange={(e) => {
                  setNewNote(e.target.value);
                  const pos = e.target.selectionStart || 0;
                  const textBefore = e.target.value.slice(0, pos);
                  const atMatch = textBefore.match(/@(\w*)$/);
                  if (atMatch) { setShowMentionMenu(true); setMentionFilter(atMatch[1].toLowerCase()); setMentionCursorPos(pos); }
                  else { setShowMentionMenu(false); }
                }}
                onKeyDown={(e) => { if (showMentionMenu && e.key === "Escape") setShowMentionMenu(false); }}
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                autoFocus
              />
              {showMentionMenu && (
                <div style={{ position: "absolute", zIndex: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: C.shadowHover, maxHeight: 160, overflowY: "auto", width: 200, bottom: "100%", marginBottom: 4 }}>
                  {mentionUsers.filter((u) => u.prenom.toLowerCase().includes(mentionFilter) || u.nom.toLowerCase().includes(mentionFilter)).map((u) => (
                    <button key={u.id} onClick={() => {
                      const before = newNote.slice(0, mentionCursorPos - mentionFilter.length - 1);
                      const after = newNote.slice(mentionCursorPos);
                      setNewNote(`${before}@${u.prenom} ${after}`);
                      setShowMentionMenu(false);
                      noteTextareaRef.current?.focus();
                    }} style={{ width: "100%", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                        {(u.prenom || "")[0] || ""}{(u.nom || "")[0] || "?"}
                      </div>
                      {u.prenom} {u.nom}
                    </button>
                  ))}
                  {mentionUsers.filter((u) => u.prenom.toLowerCase().includes(mentionFilter) || u.nom.toLowerCase().includes(mentionFilter)).length === 0 && (
                    <div style={{ padding: "8px 12px", fontSize: 12, color: C.textDim }}>Aucun utilisateur</div>
                  )}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                    <Paperclip size={13} />
                    {noteFiles.length > 0 ? `${noteFiles.length} fichier(s)` : "Joindre"}
                    <input type="file" multiple style={{ display: "none" }} onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const tooBig = files.find((f) => f.size > 10 * 1024 * 1024);
                      if (tooBig) { alert(`Fichier "${tooBig.name}" trop volumineux (max 10 Mo)`); return; }
                      if (noteFiles.length + files.length > 10) { alert("Maximum 10 fichiers par note"); return; }
                      setNoteFiles((prev) => [...prev, ...files]);
                      e.target.value = "";
                    }} />
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button C={C} variant="ghost" size="sm" onClick={() => { setShowNoteForm(false); setNewNote(""); setNoteFiles([]); }}>Annuler</Button>
                    <Button C={C} variant="primary" size="sm" disabled={!newNote.trim() && noteFiles.length === 0} onClick={async () => {
                      if (!newNote.trim() && noteFiles.length === 0) return;
                      if (isDemoMode) {
                        setNotes((prev) => [{ id: `demo-note-${Date.now()}`, contenu: newNote || `[${noteFiles.length} pièce(s) jointe(s)]`, epinglee: false, createdAt: new Date().toISOString(), auteur: { id: "demo", prenom: "Vous", nom: "" }, fichiers: [] }, ...prev]);
                        setHistorique((prev) => [{ type: "NOTE", message: newNote, chargee: "Vous", time: "À l'instant", sortDate: Date.now() }, ...prev]);
                        setNewNote(""); setNoteFiles([]); setShowNoteForm(false); toast("Note ajoutée");
                        return;
                      }
                      if (!client?.id) return;
                      const uploadedFiles: Array<{ url: string; nom: string; taille: number }> = [];
                      for (const file of noteFiles) {
                        const fd = new FormData(); fd.append("file", file); fd.append("entrepriseId", client.id);
                        try {
                          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
                          if (uploadRes.ok) { const d = await uploadRes.json(); uploadedFiles.push({ url: d.url, nom: file.name, taille: file.size }); }
                          else { toast(`Erreur upload "${file.name}"`); }
                        } catch { toast(`Erreur réseau sur "${file.name}"`); }
                      }
                      const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenu: newNote || `[${uploadedFiles.length} pièce(s) jointe(s)]`, entrepriseId: client.id, fichiers: uploadedFiles }) });
                      if (res.ok) {
                        const note = await res.json();
                        setNotes((prev) => [note, ...prev]);
                        setHistorique((prev) => [{ type: "NOTE", message: note.contenu, chargee: `${note.auteur.prenom} ${note.auteur.nom}`, time: "À l'instant", sortDate: Date.now() }, ...prev]);
                        setNewNote(""); setNoteFiles([]); setShowNoteForm(false);
                        toast(uploadedFiles.length > 0 ? `Note ajoutée (${uploadedFiles.length} pièce(s) jointe(s))` : "Note ajoutée");
                      } else { toast("Erreur création note"); }
                    }}>Ajouter</Button>
                  </div>
                </div>
                {noteFiles.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                    {noteFiles.map((file, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 8px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.textMuted }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <Paperclip size={10} /> {file.name} <span style={{ color: C.textDim, fontSize: 10 }}>({Math.round(file.size / 1024)} Ko)</span>
                        </span>
                        <button type="button" onClick={() => setNoteFiles((prev) => prev.filter((_, i) => i !== idx))} style={{ border: "none", background: "transparent", color: C.textDim, cursor: "pointer", padding: "2px 4px" }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {historique.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucune activité pour cette entreprise</div>
          )}
          {historique.map((a, i) => {
            const ActIcon = ACTIVITY_ICONS[a.type] || FileText;
            const actColor = ACTIVITY_COLORS[a.type] || "textDim";
            const isNote = a.type === "NOTE";
            const noteData = isNote ? notes.find((n) => a.message.includes(n.contenu.substring(0, 80))) : null;
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
                onMouseEnter={(e) => { if (a.id || isNote) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C[(actColor + "Dim") as keyof Theme] as string, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ActIcon size={14} color={C[actColor as keyof Theme] as string} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {isNote && editingNote === noteData?.id ? (
                      <div style={{ width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <Button C={C} variant="primary" size="sm" onClick={async (ev) => {
                            ev?.stopPropagation();
                            if (!noteData) return;
                            const res = await fetch("/api/notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: noteData.id, contenu: editContent }) });
                            if (res.ok) {
                              const updated = await res.json();
                              setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                              setHistorique((prev) => prev.map((h, idx) => idx === i ? { ...h, message: updated.contenu } : h));
                              setEditingNote(null);
                              toast("Note modifiée");
                            }
                          }}>Enregistrer</Button>
                          <Button C={C} variant="ghost" size="sm" onClick={(ev) => { ev?.stopPropagation(); setEditingNote(null); }}>Annuler</Button>
                        </div>
                      </div>
                    ) : isNote ? (() => {
                      const noteId = noteData?.id || `idx-${i}`;
                      const cleanedContent = a.message.replace(/^Note : /, "");
                      const isLong = cleanedContent.length > 150;
                      const isExpanded = expandedNotes.has(noteId);
                      const displayedContent = isLong && !isExpanded ? cleanedContent.substring(0, 150) + "…" : cleanedContent;
                      return (
                        <span style={{ whiteSpace: "pre-wrap", flex: 1 }}>
                          {displayedContent.split(/(@\w+|\/api\/files\/\S+)/g).map((part, pi) =>
                            part.startsWith("@")
                              ? <span key={pi} style={{ color: C.accent, fontWeight: 600, background: C.accentDim, padding: "0 4px", borderRadius: 4 }}>{part}</span>
                              : part.startsWith("/api/files/")
                                ? <a key={pi} href={part} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }} onClick={(e) => e.stopPropagation()}><Paperclip size={12} />{part.split("_").slice(-1)[0] || part.split("/").pop()}</a>
                                : part
                          )}
                          {isLong && (
                            <button onClick={(e) => { e.stopPropagation(); setExpandedNotes((prev) => { const n = new Set(prev); if (n.has(noteId)) n.delete(noteId); else n.add(noteId); return n; }); }}
                              style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 4, border: "none", background: "transparent", color: C.accent, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                              {isExpanded ? "Réduire" : "Voir plus"}
                            </button>
                          )}
                        </span>
                      );
                    })() : a.message}
                    {isNote && <Badge color={C.purple} bg={C.purpleDim}>Note</Badge>}
                    {a.automatique && <Badge color="#ea580c" bg="rgba(234,88,12,0.1)">Auto</Badge>}
                    {a.statutEnvoi === "ECHEC" && <Badge color="#ef4444" bg="rgba(239,68,68,0.1)">Échec</Badge>}
                    {a.statutEnvoi === "ENVOYE" && a.automatique && <Badge color="#16a34a" bg="rgba(22,163,74,0.1)">Envoyé</Badge>}
                  </div>
                  {noteData?.fichierUrl && (!noteData.fichiers || noteData.fichiers.length === 0) && (
                    <a href={fixFileUrl(noteData.fichierUrl)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, padding: "3px 8px", borderRadius: 4, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.blue, textDecoration: "none" }}>
                      <Paperclip size={10} /> {noteData.fichierNom || "Pièce jointe"}
                    </a>
                  )}
                  {noteData?.fichiers && noteData.fichiers.length > 0 && (
                    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                      {noteData.fichiers.map((f) => (
                        <a key={f.id} href={fixFileUrl(f.url)} download={f.nom} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.blue, textDecoration: "none", padding: "2px 0" }}>
                          <Paperclip size={10} /> {f.nom}
                          <span style={{ color: C.textDim, fontSize: 10 }}>({Math.round(f.taille / 1024)} Ko)</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    {a.chargee} · {a.time}
                    {isNote && noteData && editingNote !== noteData.id && (isAdmin || noteData.auteur.id === currentUserId) && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingNote(noteData.id); setEditContent(noteData.contenu); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Modifier la note">
                        <Edit3 size={11} color={C.textDim} />
                      </button>
                    )}
                    {isNote && noteData && (isAdmin || noteData.auteur.id === currentUserId) && (
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm("Supprimer cette note ?")) return;
                        const res = await fetch(`/api/notes?id=${noteData.id}`, { method: "DELETE" });
                        if (res.ok) {
                          setNotes((prev) => prev.filter((n) => n.id !== noteData.id));
                          setHistorique((prev) => prev.filter((_, idx) => idx !== i));
                        }
                      }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Supprimer la note">
                        <Trash2 size={11} color={C.textDim} />
                      </button>
                    )}
                  </div>
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
    </>
  );
}

// ========================
// FORMAT HELPERS
// ========================

function formatStatut(code: string | undefined, configs: Array<{ code: string; nom: string }>): string {
  if (!code) return "—";
  const found = configs.find((c) => c.code === code);
  return found?.nom || code;
}

function formatInteretTNK(interet?: string): string {
  const map: Record<string, string> = { OUI: "Oui", NON: "Non", NSP: "NSP", INJOIGNABLE: "Injoignable" };
  return map[interet || ""] || "Oui";
}

interface ChantierDocFull { id: string; nom: string; fichierUrl: string | null; fichierNom: string | null; fichierTaille: number | null }
interface ChantierFull {
  id: string; numero: number; nom: string | null; description: string | null;
  devisRecu: boolean; devisFichierUrl: string | null; devisFichierNom: string | null; dateDevis: string | null;
  factureRecue: boolean; factureFichierUrl: string | null; factureFichierNom: string | null; dateFacture: string | null;
  attestationRecue: boolean; attestationFichierUrl: string | null; attestationFichierNom: string | null; dateAttestation: string | null;
  photosRecues: boolean; photosFichierUrl: string | null; photosFichierNom: string | null; datePhotos: string | null;
  documents: ChantierDocFull[];
}

function computeQualifProgress(q: {
  rges?: Array<{ rgeCode: string }>;
  niveauVise?: string | null;
  certificateurType?: string | null;
  identifiantCertificateur?: string | null;
  bonCommandePaye?: boolean;
  chantiers?: Array<{ numero: number; devisRecu: boolean; factureRecue: boolean; attestationRecue: boolean; photosRecues?: boolean }>;
}): number {
  let score = 0;
  if ((q.rges || []).length > 0) score += 20;
  if (q.niveauVise) score += 10;
  if (q.certificateurType && q.identifiantCertificateur) score += 20;
  if (q.bonCommandePaye) score += 20;
  const mainChantiers = (q.chantiers || []).filter((c) => c.numero <= 3);
  const complets = mainChantiers.filter((c) => c.devisRecu && c.factureRecue && c.attestationRecue && c.photosRecues).length;
  score += (complets / 3) * 30;
  return Math.round(Math.min(100, score));
}

function progressColor(pct: number): string {
  if (pct < 30) return "#ef4444";
  if (pct < 70) return "#f59e0b";
  return "#16a34a";
}

function QualifCertificateur({
  C, qualif, antennes, updateQualif,
}: {
  C: Theme;
  qualif: {
    certificateurType?: string | null;
    emailCertificateur?: string | null;
    antenneQualibatId?: string | null;
    identifiantCertificateur?: string | null;
    motDePasseCertificateur?: string | null;
    interlocuteurCertificateur?: string | null;
    dateCommission?: string | null;
    bonCommandeDemande?: boolean;
    dateBonCommandeDemande?: string | null;
    bonCommandePaye?: boolean;
    dateBonCommandePaye?: string | null;
    bonCommandeFichierUrl?: string | null;
    bonCommandeFichierNom?: string | null;
    bonsCommandeFichiers?: Array<{ id: string; url: string; nom: string; taille?: number | null; type?: string | null }>;
    id?: string;
  };
  antennes: Array<{ id: string; nom: string; email: string | null; telephone: string | null; delegation: string | null }>;
  updateQualif: (patch: Record<string, unknown>) => Promise<void> | void;
}) {
  const certType = qualif.certificateurType || "";
  const isQualibat = certType === "Qualibat";
  const currentAntenneId = qualif.antenneQualibatId || "";
  const selectedAntenne = antennes.find((a) => a.id === currentAntenneId);

  const CERTIFICATEUR_CONTACTS: Record<string, { email: string; telephone: string }> = {
    "Qualit'EnR": { email: "qualification@qualit-enr.org", telephone: "01 48 78 70 90" },
    "Qualifelec": { email: "contact@qualifelec.fr", telephone: "01 53 06 65 20" },
    "Certibat": { email: "certibat-contact@qualibat.com", telephone: "" },
  };
  const certContact = CERTIFICATEUR_CONTACTS[certType];

  const iStyle: React.CSSProperties = {
    width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`,
    background: C.surface, color: C.text, fontSize: 11, outline: "none", boxSizing: "border-box",
  };

  // Local draft state for text inputs — commit to server on blur
  const [draft, setDraft] = useState({
    email: qualif.emailCertificateur || "",
    identifiant: qualif.identifiantCertificateur || "",
    motDePasse: qualif.motDePasseCertificateur || "",
    interlocuteur: qualif.interlocuteurCertificateur || "",
  });
  useEffect(() => {
    setDraft({
      email: qualif.emailCertificateur || "",
      identifiant: qualif.identifiantCertificateur || "",
      motDePasse: qualif.motDePasseCertificateur || "",
      interlocuteur: qualif.interlocuteurCertificateur || "",
    });
  }, [qualif.emailCertificateur, qualif.identifiantCertificateur, qualif.motDePasseCertificateur, qualif.interlocuteurCertificateur]);

  // Default open if certificateurType is filled, closed otherwise
  const [open, setOpen] = useState(!!certType);
  const summary = [
    certType,
    isQualibat && selectedAntenne?.nom,
  ].filter(Boolean).join(" · ");

  const Chip = ({ checked, date, label, onClick, onDateChange }: { checked: boolean; date: string | null | undefined; label: string; onClick: () => void; onDateChange?: (d: string) => void }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: checked ? C.accentDim : "transparent", border: `1px solid ${checked ? C.accent + "40" : C.border}`, fontSize: 10.5, fontWeight: 600 }}>
      <button
        type="button"
        onClick={onClick}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, color: checked ? C.accentText : C.textMuted, fontSize: 10.5, fontWeight: 600 }}
      >
        <div style={{ width: 11, height: 11, borderRadius: 3, border: `1.5px solid ${checked ? C.accent : C.border}`, background: checked ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {checked && <Check size={7} color="#fff" strokeWidth={3} />}
        </div>
        <span>{label}</span>
      </button>
      {checked && date && onDateChange && (
        <input
          type="date"
          value={new Date(date).toISOString().slice(0, 10)}
          onChange={(e) => onDateChange(e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
          onClick={(e) => e.stopPropagation()}
          style={{ border: "none", background: "transparent", color: C.textDim, fontSize: 10, fontWeight: 400, width: 85, padding: 0, outline: "none", cursor: "pointer" }}
        />
      )}
      {checked && date && !onDateChange && <span style={{ color: C.textDim, fontWeight: 400 }}>· {new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</span>}
    </span>
  );

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: open ? 8 : 0, cursor: "pointer",
        }}
      >
        <ChevronRight
          size={12}
          color={C.textDim}
          style={{ transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Certificateur
        </span>
        {!open && summary && (
          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>— {summary}</span>
        )}
      </div>
      {open && (
        <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {/* Ligne 1 */}
          <div>
            <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>Type de certificateur</label>
            <select
              value={certType}
              onChange={(e) => {
                const v = e.target.value;
                const patch: Record<string, unknown> = { certificateurType: v || null };
                if (v !== "Qualibat") patch.antenneQualibatId = null;
                const contact = CERTIFICATEUR_CONTACTS[v];
                if (contact) patch.emailCertificateur = contact.email;
                updateQualif(patch);
              }}
              style={iStyle}
            >
              <option value="">-- Choisir --</option>
              <option value="Qualibat">Qualibat</option>
              <option value="Certibat">Certibat</option>
              <option value="Qualit'EnR">Qualit&apos;EnR</option>
              <option value="Qualifelec">Qualifelec</option>
            </select>
          </div>
          {isQualibat ? (
            <div>
              <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>Antenne Qualibat</label>
              <select
                value={currentAntenneId}
                onChange={(e) => updateQualif({ antenneQualibatId: e.target.value || null })}
                style={iStyle}
              >
                <option value="">-- Sélectionner --</option>
                {antennes.map((a) => <option key={a.id} value={a.id}>{a.nom}{a.delegation ? ` (${a.delegation})` : ""}</option>)}
              </select>
              {selectedAntenne && (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input type="email" readOnly value={selectedAntenne.email || ""} placeholder="Email" style={{ ...iStyle, flex: 1, fontSize: 9, padding: "3px 6px", background: C.bg, color: C.textDim }} />
                  <input type="tel" readOnly value={selectedAntenne.telephone ? formatPhone(selectedAntenne.telephone) : ""} placeholder="Téléphone" style={{ ...iStyle, flex: 1, fontSize: 9, padding: "3px 6px", background: C.bg, color: C.textDim }} />
                </div>
              )}
              {!selectedAntenne && qualif.emailCertificateur && (
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 3 }}>{qualif.emailCertificateur}</div>
              )}
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>Email certificateur</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                onBlur={() => { if (draft.email !== (qualif.emailCertificateur || "")) updateQualif({ emailCertificateur: draft.email || null }); }}
                placeholder="email@certificateur.fr"
                style={iStyle}
              />
              {certContact?.telephone && (
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 3 }}>Tél : {certContact.telephone}</div>
              )}
            </div>
          )}
          {/* Ligne 2 */}
          <div>
            <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>Identifiant</label>
            <input
              type="text"
              value={draft.identifiant}
              onChange={(e) => setDraft((d) => ({ ...d, identifiant: e.target.value }))}
              onBlur={() => { if (draft.identifiant !== (qualif.identifiantCertificateur || "")) updateQualif({ identifiantCertificateur: draft.identifiant || null }); }}
              placeholder="Identifiant"
              style={iStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>Mot de passe</label>
            <input
              type="text"
              value={draft.motDePasse}
              onChange={(e) => setDraft((d) => ({ ...d, motDePasse: e.target.value }))}
              onBlur={() => { if (draft.motDePasse !== (qualif.motDePasseCertificateur || "")) updateQualif({ motDePasseCertificateur: draft.motDePasse || null }); }}
              placeholder="Mot de passe"
              style={iStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>Interlocuteur</label>
            <input
              type="text"
              value={draft.interlocuteur}
              onChange={(e) => setDraft((d) => ({ ...d, interlocuteur: e.target.value }))}
              onBlur={() => { if (draft.interlocuteur !== (qualif.interlocuteurCertificateur || "")) updateQualif({ interlocuteurCertificateur: draft.interlocuteur || null }); }}
              placeholder="Interlocuteur"
              style={iStyle}
            />
          </div>
          {/* Ligne 3 */}
          <div>
            <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>Date de commission</label>
            <input
              type="date"
              value={qualif.dateCommission ? new Date(qualif.dateCommission).toISOString().slice(0, 10) : ""}
              onChange={(e) => updateQualif({ dateCommission: e.target.value || null })}
              style={iStyle}
            />
          </div>
          <div style={{ gridColumn: "2 / span 2", display: "flex", flexWrap: "wrap", alignItems: "end", gap: 6, paddingBottom: 2 }}>
            <Chip
              checked={!!qualif.bonCommandeDemande}
              date={qualif.dateBonCommandeDemande}
              label="Bon commandé"
              onClick={() => {
                const newVal = !qualif.bonCommandeDemande;
                updateQualif({ bonCommandeDemande: newVal, dateBonCommandeDemande: newVal ? new Date().toISOString() : null });
              }}
              onDateChange={(d) => updateQualif({ dateBonCommandeDemande: d })}
            />
            <Chip
              checked={!!qualif.bonCommandePaye}
              date={qualif.dateBonCommandePaye}
              label="Bon payé"
              onClick={() => {
                const newVal = !qualif.bonCommandePaye;
                updateQualif({ bonCommandePaye: newVal, dateBonCommandePaye: newVal ? new Date().toISOString() : null });
              }}
              onDateChange={(d) => updateQualif({ dateBonCommandePaye: d })}
            />
            {qualif.bonCommandeFichierUrl && (!qualif.bonsCommandeFichiers || qualif.bonsCommandeFichiers.length === 0) && (
              <a href={fixFileUrl(qualif.bonCommandeFichierUrl)} download={qualif.bonCommandeFichierNom || "bon-commande"} style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "4px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                background: C.blueDim, color: C.blue, textDecoration: "none",
              }}>
                <Download size={10} /> {qualif.bonCommandeFichierNom ? qualif.bonCommandeFichierNom.slice(0, 20) : "Fichier"}
              </a>
            )}
            {qualif.bonsCommandeFichiers?.map((f) => (
              <div key={f.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: C.blueDim, color: C.blue }}>
                <a href={fixFileUrl(f.url)} download={f.nom} style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "inherit", textDecoration: "none" }}>
                  <Download size={10} /> {f.nom.length > 20 ? f.nom.slice(0, 20) + "…" : f.nom}
                </a>
                <button type="button" onClick={async () => {
                  if (!confirm(`Supprimer "${f.nom}" ?`)) return;
                  const res = await fetch(`/api/qualifications/${qualif.id}/fichiers/${f.id}`, { method: "DELETE" });
                  if (res.ok) updateQualif({ bonsCommandeFichiers: (qualif.bonsCommandeFichiers || []).filter((x) => x.id !== f.id) });
                }} style={{ background: "transparent", border: "none", color: C.textDim, cursor: "pointer", padding: "0 2px", fontSize: 10 }} title="Supprimer">×</button>
              </div>
            ))}
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "4px 8px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${C.border}`, background: "transparent",
              fontSize: 10, color: C.textDim,
            }} title="Ajouter un document (bon de commande, facture, etc.)">
              <Upload size={10} /> Ajouter
              <input type="file" multiple style={{ display: "none" }} onChange={async (ev) => {
                const files = Array.from(ev.target.files || []);
                if (files.length === 0) return;
                const tooBig = files.find((fl) => fl.size > 10 * 1024 * 1024);
                if (tooBig) { alert(`Fichier "${tooBig.name}" trop volumineux (max 10 Mo)`); return; }
                const uploaded: Array<{ id: string; url: string; nom: string; taille?: number | null; type?: string | null }> = [];
                for (const file of files) {
                  const fd = new FormData(); fd.append("file", file);
                  const upRes = await fetch("/api/upload", { method: "POST", body: fd });
                  if (!upRes.ok) continue;
                  const { url } = await upRes.json();
                  const createRes = await fetch(`/api/qualifications/${qualif.id}/fichiers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, nom: file.name, taille: file.size }) });
                  if (createRes.ok) uploaded.push(await createRes.json());
                }
                if (uploaded.length > 0) updateQualif({ bonsCommandeFichiers: [...(qualif.bonsCommandeFichiers || []), ...uploaded] });
                ev.target.value = "";
              }} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function QualifChantiers({
  C, qualificationId, chantiers, expandedCols, setExpandedCols, isDemoMode, toast, onUpdate,
}: {
  C: Theme;
  qualificationId: string;
  chantiers: ChantierFull[];
  expandedCols: Record<string, boolean>;
  setExpandedCols: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isDemoMode: boolean;
  toast: (msg: string) => void;
  onUpdate: (newChantiers: ChantierFull[]) => void;
}) {
  const main = chantiers.filter((c) => c.numero <= 3);
  const complets = main.filter((c) => c.devisRecu && c.factureRecue && c.attestationRecue && c.photosRecues).length;

  const getStatus = (c: ChantierFull): "complet" | "en-cours" | "vide" => {
    if (c.numero <= 3) {
      if (c.devisRecu && c.factureRecue && c.attestationRecue && c.photosRecues) return "complet";
      if (c.devisRecu || c.factureRecue || c.attestationRecue || c.photosRecues || c.documents.length > 0) return "en-cours";
      return "vide";
    }
    return c.documents.length > 0 ? "complet" : "vide";
  };
  const statusColor = (s: string) => s === "complet" ? "#16a34a" : s === "en-cours" ? "#f59e0b" : C.textDim;

  const updateChantier = async (chantierId: string, patch: Record<string, unknown>) => {
    if (isDemoMode) return;
    const res = await fetch(`/api/chantiers/${chantierId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(chantiers.map((c) => c.id === chantierId ? updated : c));
    }
  };

  const uploadChantierDoc = async (chantierId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/chantiers/${chantierId}/documents`, { method: "POST", body: formData });
    if (res.ok) {
      const doc = await res.json();
      onUpdate(chantiers.map((c) => c.id === chantierId ? { ...c, documents: [doc, ...c.documents] } : c));
      toast("Document uploadé");
    }
  };

  const deleteChantierDoc = async (chantierId: string, docId: string) => {
    await fetch(`/api/chantiers/${chantierId}/documents?docId=${docId}`, { method: "DELETE" });
    onUpdate(chantiers.map((c) => c.id === chantierId ? { ...c, documents: c.documents.filter((d) => d.id !== docId) } : c));
  };

  if (chantiers.length === 0) {
    return (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textDim, fontStyle: "italic" }}>Aucun chantier de référence pour cette qualification.</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>Chantiers de référence</span>
        <span style={{ fontSize: 10, color: C.textDim }}>{complets}/{main.length} complets</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
      {chantiers.map((c) => {
        const status = getStatus(c);
        const key = `qchantier-${c.id}`;
        const isOpen = expandedCols[key] === true;
        const title = c.numero <= 3 ? `Chantier ${c.numero}` : `Chantier supplémentaire ${c.numero - 3}`;
        const isMain = c.numero <= 3;
        const DotIndicator = ({ recu, label }: { recu: boolean; label: string }) => (
          <span
            title={`${label}: ${recu ? "reçu" : "manquant"}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 9.5, color: recu ? C.text : C.textDim, fontWeight: recu ? 600 : 400,
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: recu ? "#16a34a" : "transparent",
              border: `1.5px solid ${recu ? "#16a34a" : C.textDim}`,
              flexShrink: 0,
            }} />
            {label.slice(0, 1)}
          </span>
        );

        return (
          <div
            key={c.id}
            style={{
              gridColumn: isOpen ? "1 / -1" : "auto",
              borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden",
              background: C.surface,
            }}
          >
            <div
              onClick={() => setExpandedCols((prev) => ({ ...prev, [key]: !isOpen }))}
              style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 10px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ChevronRight size={11} color={C.textDim} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
                {status === "complet" ? <CheckCircle size={12} color="#16a34a" /> : status === "en-cours" ? <Clock size={12} color="#f59e0b" /> : <Circle size={12} color={C.textDim} />}
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor(status), flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {title}{c.nom ? ` — ${c.nom}` : ""}
                </span>
                {isMain ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <DotIndicator recu={c.devisRecu} label="Devis" />
                    <DotIndicator recu={c.factureRecue} label="Facture" />
                    <DotIndicator recu={c.attestationRecue} label="Attestation" />
                    <DotIndicator recu={c.photosRecues} label="Photos" />
                  </div>
                ) : (
                  <span style={{ fontSize: 10, color: C.textDim, flexShrink: 0 }}>{c.documents.length} doc{c.documents.length > 1 ? "s" : ""}</span>
                )}
              </div>
              {isOpen && (
                <input
                  defaultValue={c.nom || ""}
                  placeholder="Nom / adresse..."
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => updateChantier(c.id, { nom: e.target.value || null })}
                  style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 10, width: "100%", outline: "none", boxSizing: "border-box" }}
                />
              )}
            </div>

            {isOpen && (
              <div style={{ padding: "8px 10px", background: C.bg }}>
                {c.numero <= 3 && [
                  { key: "devis", label: "Devis", recu: c.devisRecu, fichierUrl: c.devisFichierUrl, fichierNom: c.devisFichierNom, date: c.dateDevis, recuKey: "devisRecu", urlKey: "devisFichierUrl", nomKey: "devisFichierNom" },
                  { key: "facture", label: "Facture", recu: c.factureRecue, fichierUrl: c.factureFichierUrl, fichierNom: c.factureFichierNom, date: c.dateFacture, recuKey: "factureRecue", urlKey: "factureFichierUrl", nomKey: "factureFichierNom" },
                  { key: "attestation", label: "Attestation travaux", recu: c.attestationRecue, fichierUrl: c.attestationFichierUrl, fichierNom: c.attestationFichierNom, date: c.dateAttestation, recuKey: "attestationRecue", urlKey: "attestationFichierUrl", nomKey: "attestationFichierNom" },
                  { key: "photos", label: "Photos", recu: c.photosRecues, fichierUrl: c.photosFichierUrl, fichierNom: c.photosFichierNom, date: c.datePhotos, recuKey: "photosRecues", urlKey: "photosFichierUrl", nomKey: "photosFichierNom" },
                ].map((doc) => (
                  <div key={doc.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div onClick={() => updateChantier(c.id, { [doc.recuKey]: !doc.recu })} style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `2px solid ${doc.recu ? C.accent : C.border}`,
                      background: doc.recu ? C.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}>
                      {doc.recu && <Check size={9} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 11, color: doc.recu ? C.text : C.textMuted, fontWeight: doc.recu ? 500 : 400, flex: 1 }}>{doc.label}</span>
                    {doc.date && <span style={{ fontSize: 9, color: C.textDim }}>{new Date(doc.date).toLocaleDateString("fr-FR")}</span>}
                    {doc.fichierUrl && (
                      <a href={fixFileUrl(doc.fichierUrl)} download={doc.fichierNom || doc.label} onClick={(e) => e.stopPropagation()}
                        style={{ padding: "2px 6px", borderRadius: 4, background: C.blueDim, color: C.blue, fontSize: 9, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <Download size={9} /> {doc.fichierNom ? doc.fichierNom.slice(0, 14) : "Fichier"}
                      </a>
                    )}
                    <label style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                      <Upload size={9} color={C.textDim} />
                        <input type="file" style={{ display: "none" }} onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          if (res.ok) {
                            const { url } = await res.json();
                            updateChantier(c.id, { [doc.recuKey]: true, [doc.urlKey]: url, [doc.nomKey]: file.name });
                          }
                        }} />
                      </label>
                  </div>
                ))}

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, marginBottom: 4 }}>Documents complémentaires</div>
                  {c.documents.map((d) => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 10 }}>
                      <Paperclip size={10} color={C.textDim} />
                      <span style={{ flex: 1, color: C.text }}>{d.fichierNom || d.nom}</span>
                      {d.fichierUrl && (
                        <a href={fixFileUrl(d.fichierUrl)} download={d.fichierNom || d.nom} style={{ color: C.blue, textDecoration: "none" }}>
                          <Download size={9} />
                        </a>
                      )}
                      <button onClick={() => deleteChantierDoc(c.id, d.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                        <Trash2 size={9} color={C.textDim} />
                      </button>
                    </div>
                  ))}
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 4, border: `1px dashed ${C.border}`, background: "transparent", color: C.textDim, fontSize: 10, cursor: "pointer", marginTop: 4 }}>
                    <Plus size={10} /> Ajouter un document
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
    </div>
  );
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
              background: "rgba(245,158,11,0.18)", color: "#b45309",
              fontSize: 11, fontWeight: 600,
            }}>
              {code}{opt ? ` - ${opt.nom.slice(0, 30)}${opt.nom.length > 30 ? "…" : ""}` : ""}
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(code); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                title="Retirer"
              >
                <X size={11} color="#b45309" />
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
