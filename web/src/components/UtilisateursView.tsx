"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/format";
import {
  Button,
  Input,
  Select,
  Label,
  Modal,
  RoleBadge,
  Alerte,
  Spinner,
  EmptyState,
  Th,
  Td,
  FormMessage,
  useFormMessage,
} from "@/components/ui";
import type { SessionUser } from "@/lib/auth";

interface Utilisateur {
  id: number;
  societe: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: string;
  actif: boolean;
  cree_le: string;
}

const VIDE = { societe: "", nom: "", prenom: "", email: "", telephone: "", role: "consultant", actif: true, mot_de_passe: "" };

export default function UtilisateursView({ session }: { session: SessionUser }) {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modal, setModal] = useState<"ajout" | "edit" | null>(null);
  const [edite, setEdite] = useState<Utilisateur | null>(null);

  const charger = useCallback(async (avecIndicateur = true) => {
    if (avecIndicateur) setChargement(true);
    try {
      const d = await api<{ utilisateurs: Utilisateur[] }>("/api/utilisateurs");
      setUtilisateurs(d.utilisateurs);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void charger(false); }, 0);
    return () => clearTimeout(t);
  }, [charger]);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Utilisateurs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion des comptes et des droits (F02) — réservée aux administrateurs.
          </p>
        </div>
        <Button onClick={() => { setEdite(null); setModal("ajout"); }}>+ Ajouter un utilisateur</Button>
      </header>

      {erreur && <Alerte>{erreur}</Alerte>}
      {chargement ? (
        <Spinner />
      ) : utilisateurs.length === 0 ? (
        <EmptyState>Aucun utilisateur.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Identité</Th>
                <Th>Société</Th>
                <Th>Contact</Th>
                <Th>Rôle</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">
                    {u.prenom} {u.nom}
                    {u.id === session.id && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">vous</span>
                    )}
                  </Td>
                  <Td>{u.societe}</Td>
                  <Td>
                    <p>{u.email}</p>
                    <p className="text-xs text-slate-500">{u.telephone ?? "—"}</p>
                  </Td>
                  <Td><RoleBadge role={u.role} /></Td>
                  <Td>
                    {u.actif ? (
                      <span className="text-emerald-600 text-xs font-medium">Actif</span>
                    ) : (
                      <span className="text-red-500 text-xs font-medium">Désactivé</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => { setEdite(u); setModal("edit"); }}>
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs"
                        onClick={async () => {
                          if (!confirm(`Réinitialiser le mot de passe de ${u.email} ?`)) return;
                          const mdp = prompt("Nouveau mot de passe (8 caractères min) :");
                          if (!mdp) return;
                          try {
                            await api(`/api/utilisateurs/${u.id}`, { method: "PATCH", body: JSON.stringify({ mot_de_passe: mdp }) });
                            alert("Mot de passe réinitialisé.");
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Erreur");
                          }
                        }}
                      >
                        MDP
                      </Button>
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (u.id === session.id) { alert("Impossible de supprimer son propre compte."); return; }
                          if (!confirm(`Supprimer le compte ${u.email} ?`)) return;
                          try {
                            await api(`/api/utilisateurs/${u.id}`, { method: "DELETE" });
                            charger();
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Erreur");
                          }
                        }}
                      >
                        Suppr.
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-slate-400">
        Premier compte : alice.renaud@technova.demo (admin). Derniers accès :{" "}
        {utilisateurs[0] ? formatDate(utilisateurs[0].cree_le) : "—"}
      </div>

      {modal && (
        <Modal title={modal === "ajout" ? "Ajouter un utilisateur" : `Modifier ${edite?.prenom} ${edite?.nom}`} onClose={() => setModal(null)}>
          <FormulaireUtilisateur existant={modal === "edit" ? edite : null} onFait={() => { setModal(null); charger(); }} />
        </Modal>
      )}
    </div>
  );
}

function FormulaireUtilisateur({ existant, onFait }: { existant: Utilisateur | null; onFait: () => void }) {
  const { message, tone, setError, setSuccess } = useFormMessage();
  const [charge, setCharge] = useState(false);
  const [form, setForm] = useState(existant ? { ...VIDE, ...existant } : VIDE);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setCharge(true);
    try {
      if (existant) {
        await api(`/api/utilisateurs/${existant.id}`, { method: "PUT", body: JSON.stringify(form) });
        setSuccess("Utilisateur modifié.");
      } else {
        if (!form.mot_de_passe) { setError("Le mot de passe initial est obligatoire."); setCharge(false); return; }
        await api("/api/utilisateurs", { method: "POST", body: JSON.stringify(form) });
        setSuccess("Utilisateur créé.");
      }
      setTimeout(onFait, 700);
    } catch (err) {
      setError(err);
      setCharge(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Nom</Label><Input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} /></div>
        <div><Label>Prénom</Label><Input required value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} /></div>
        <div><Label>Société</Label><Input required value={form.societe} onChange={(e) => setForm((f) => ({ ...f, societe: e.target.value }))} /></div>
        <div><Label>Téléphone</Label><Input value={form.telephone ?? ""} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} /></div>
        <div className="col-span-2"><Label>E-mail</Label><Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
        {!existant && (
          <div className="col-span-2"><Label>Mot de passe initial (8 caractères min)</Label><Input type="password" required value={(form as { mot_de_passe?: string }).mot_de_passe ?? ""} onChange={(e) => setForm((f) => ({ ...f, mot_de_passe: e.target.value }))} /></div>
        )}
        <div><Label>Rôle</Label>
          <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="admin">Administrateur</option>
            <option value="gestionnaire">Gestionnaire</option>
            <option value="consultant">Consultant</option>
          </Select>
        </div>
        <div><Label>Compte actif</Label>
          <Select value={form.actif ? "true" : "false"} onChange={(e) => setForm((f) => ({ ...f, actif: e.target.value === "true" }))}>
            <option value="true">Actif</option>
            <option value="false">Désactivé</option>
          </Select>
        </div>
      </div>
      <p className="text-xs text-slate-400">Rôles : admin (tout), gestionnaire (parc + sauvegardes), consultant (lecture).</p>
      <FormMessage message={message} tone={tone} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onFait}>Annuler</Button>
        <Button type="submit" disabled={charge}>{charge ? "Enregistrement…" : "Enregistrer"}</Button>
      </div>
    </form>
  );
}
