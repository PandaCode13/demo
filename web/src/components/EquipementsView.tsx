"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/format";
import {
  Button,
  Select,
  Input,
  Label,
  Modal,
  TypeBadge,
  Alerte,
  Spinner,
  EmptyState,
  Th,
  Td,
  FormMessage,
  useFormMessage,
} from "@/components/ui";
import type { SessionUser } from "@/lib/auth";

interface Equipement {
  id: number;
  numero_machine: string;
  type: string;
  os: string;
  os_version: string;
  ipv4: string | null;
  mac: string | null;
  dns: string | null;
  utilisateur_id: number | null;
  utilisateur_nom: string | null;
  utilisateur_prenom: string | null;
  utilisateur_email: string | null;
  mis_a_jour_le: string;
}

interface UtilisateurOption {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  societe: string;
}

interface Filtres {
  q: string;
  type: string;
  non_attribue: boolean;
}

const VIDE = {
  numero_machine: "",
  type: "poste_de_travail",
  os: "",
  os_version: "",
  ipv4: "",
  mac: "",
  dns: "",
  utilisateur_id: "" as string | number,
};

export default function EquipementsView({ utilisateur }: { utilisateur: SessionUser }) {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurOption[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtres, setFiltres] = useState<Filtres>({ q: "", type: "", non_attribue: false });
  const [modal, setModal] = useState<"ajout" | "edit" | null>(null);
  const [edite, setEdite] = useState<Equipement | null>(null);
  const [associe, setAssocie] = useState<Equipement | null>(null);

  const gestionnaire = utilisateur.role === "admin" || utilisateur.role === "gestionnaire";

  const charger = useCallback(async (avecIndicateur = true) => {
    if (avecIndicateur) setChargement(true);
    try {
      const params = new URLSearchParams();
      if (filtres.q) params.set("q", filtres.q);
      if (filtres.type) params.set("type", filtres.type);
      if (filtres.non_attribue) params.set("non_attribue", "1");
      const data = await api<{ equipements: Equipement[] }>(
        `/api/equipements${params.toString() ? `?${params}` : ""}`
      );
      setEquipements(data.equipements);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setChargement(false);
    }
  }, [filtres]);

  useEffect(() => {
    const t = setTimeout(() => { void charger(false); }, 0);
    return () => clearTimeout(t);
  }, [charger]);

  useEffect(() => {
    if (!gestionnaire) return;
    api<{ utilisateurs: UtilisateurOption[] }>("/api/utilisateurs")
      .then((d) => setUtilisateurs(d.utilisateurs))
      .catch(() => setUtilisateurs([]));
  }, [gestionnaire]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Équipements</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestion du parc informatique : recherche, filtrage et association utilisateur.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <Label>Rechercher (F04)</Label>
          <Input
            placeholder="Numéro de machine, OS, DNS, utilisateur…"
            value={filtres.q}
            onChange={(e) => setFiltres((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
        <div className="w-44">
          <Label>Type</Label>
          <Select
            value={filtres.type}
            onChange={(e) => setFiltres((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">Tous</option>
            <option value="poste_de_travail">Poste de travail</option>
            <option value="portable">Portable</option>
            <option value="serveur">Serveur</option>
            <option value="imprimante">Imprimante</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filtres.non_attribue}
            onChange={(e) =>
              setFiltres((f) => ({ ...f, non_attribue: e.target.checked }))
            }
            className="size-4 rounded border-slate-300"
          />
          Non attribués
        </label>
        {gestionnaire && (
          <Button onClick={() => { setEdite(null); setModal("ajout"); }}>
            + Ajouter un équipement
          </Button>
        )}
      </div>

      {erreur && <Alerte>{erreur}</Alerte>}
      {chargement ? (
        <Spinner />
      ) : equipements.length === 0 ? (
        <EmptyState>Aucun équipement ne correspond aux critères.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Machine</Th>
                <Th>Type</Th>
                <Th>Système</Th>
                <Th>Réseau</Th>
                <Th>Utilisateur</Th>
                <Th>MAJ</Th>
                {gestionnaire && <Th className="text-right">Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {equipements.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">{e.numero_machine}</Td>
                  <Td><TypeBadge type={e.type} /></Td>
                  <Td>
                    <p>{e.os}</p>
                    <p className="text-xs text-slate-500">{e.os_version}</p>
                  </Td>
                  <Td>
                    <p className="font-mono text-xs">{e.ipv4 ?? "—"}</p>
                    <p className="font-mono text-xs text-slate-500">{e.mac ?? "—"}</p>
                  </Td>
                  <Td>
                    {e.utilisateur_email ? (
                      <>
                        <p className="text-slate-900">
                          {e.utilisateur_prenom} {e.utilisateur_nom}
                        </p>
                        <p className="text-xs text-slate-500">{e.utilisateur_email}</p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Non attribué</span>
                    )}
                  </Td>
                  <Td className="text-xs text-slate-500">{formatDate(e.mis_a_jour_le)}</Td>
                  {gestionnaire && (
                    <Td className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => { setEdite(e); setModal("edit"); }}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => setAssocie(e)}
                        >
                          Associer
                        </Button>
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (!confirm(`Supprimer ${e.numero_machine} ?`)) return;
                            try {
                              await api(`/api/equipements/${e.id}`, { method: "DELETE" });
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        {equipements.length} équipement(s) affiché(s) · données fictives de démonstration.
      </p>

      {(modal || associe) && (
        <Modal
          title={modal === "ajout" ? "Ajouter un équipement" : modal === "edit" ? `Modifier ${edite?.numero_machine}` : "Association utilisateur"}
          onClose={() => { setModal(null); setAssocie(null); }}
          wide
        >
          {modal && (
            <FormulaireEquipement
              existant={modal === "edit" ? edite : null}
              utilisateurs={utilisateurs}
              onFait={() => { setModal(null); charger(); }}
            />
          )}
          {associe && (
            <FormulaireAssociation
              equipement={associe}
              utilisateurs={utilisateurs}
              onFait={() => { setAssocie(null); charger(); }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function FormulaireEquipement({
  existant,
  utilisateurs,
  onFait,
}: {
  existant: Equipement | null;
  utilisateurs: UtilisateurOption[];
  onFait: () => void;
}) {
  const { message, tone, setError, setSuccess } = useFormMessage();
  const [charge, setCharge] = useState(false);
  const [form, setForm] = useState(
    existant
      ? {
          ...VIDE,
          ...existant,
          ipv4: existant.ipv4 ?? "",
          mac: existant.mac ?? "",
          dns: existant.dns ?? "",
          utilisateur_id: existant.utilisateur_id ?? "",
        }
      : VIDE
  );

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setCharge(true);
    try {
      if (existant) {
        await api(`/api/equipements/${existant.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...form,
            utilisateur_id: form.utilisateur_id || null,
          }),
        });
        setSuccess("Équipement modifié et action journalisée (F06, F07).");
      } else {
        await api("/api/equipements", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            utilisateur_id: form.utilisateur_id || null,
          }),
        });
        setSuccess("Équipement ajouté et action journalisée (F03, F07).");
      }
      setTimeout(onFait, 600);
    } catch (err) {
      setError(err);
      setCharge(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Numéro de machine *</Label>
          <Input
            required
            value={form.numero_machine}
            onChange={(e) => setForm((f) => ({ ...f, numero_machine: e.target.value }))}
            placeholder="TECH-WS-0001"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="poste_de_travail">Poste de travail</option>
            <option value="portable">Portable</option>
            <option value="serveur">Serveur</option>
            <option value="imprimante">Imprimante</option>
            <option value="autre">Autre</option>
          </Select>
        </div>
        <div>
          <Label>Système d&apos;exploitation *</Label>
          <Input
            required
            list="os-list"
            value={form.os}
            onChange={(e) => setForm((f) => ({ ...f, os: e.target.value }))}
            placeholder="Windows"
          />
        </div>
        <div>
          <Label>Version *</Label>
          <Input
            required
            value={form.os_version}
            onChange={(e) => setForm((f) => ({ ...f, os_version: e.target.value }))}
            placeholder="11 Pro 23H2"
          />
        </div>
        <div>
          <Label>Adresse IPv4</Label>
          <Input
            value={form.ipv4}
            onChange={(e) => setForm((f) => ({ ...f, ipv4: e.target.value }))}
            placeholder="10.0.1.11"
          />
        </div>
        <div>
          <Label>Adresse MAC</Label>
          <Input
            value={form.mac}
            onChange={(e) => setForm((f) => ({ ...f, mac: e.target.value }))}
            placeholder="00:1A:2B:3C:4D:01"
          />
        </div>
        <div className="col-span-2">
          <Label>Nom DNS</Label>
          <Input
            value={form.dns}
            onChange={(e) => setForm((f) => ({ ...f, dns: e.target.value }))}
            placeholder="tech-ws-0001.technova.local"
          />
        </div>
        <div className="col-span-2">
          <Label>Utilisateur associé (F05)</Label>
          <Select
            value={form.utilisateur_id}
            onChange={(e) => setForm((f) => ({ ...f, utilisateur_id: e.target.value }))}
          >
            <option value="">— Non attribué —</option>
            {utilisateurs.map((u) => (
              <option key={u.id} value={u.id}>
                {u.prenom} {u.nom} — {u.email} ({u.societe})
              </option>
            ))}
          </Select>
        </div>
      </div>
      <datalist id="os-list">
        <option value="Windows" />
        <option value="Ubuntu" />
        <option value="Debian" />
        <option value="macOS" />
        <option value="Fedora" />
      </datalist>
      <FormMessage message={message} tone={tone} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onFait()}>Annuler</Button>
        <Button type="submit" disabled={charge}>
          {charge ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function FormulaireAssociation({
  equipement,
  utilisateurs,
  onFait,
}: {
  equipement: Equipement;
  utilisateurs: UtilisateurOption[];
  onFait: () => void;
}) {
  const { message, tone, setError, setSuccess } = useFormMessage();
  const [charge, setCharge] = useState(false);
  const [utilisateurId, setUtilisateurId] = useState<string | number>(
    equipement.utilisateur_id ?? ""
  );

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setCharge(true);
    try {
      await api(`/api/equipements/${equipement.id}`, {
        method: "PATCH",
        body: JSON.stringify({ utilisateur_id: utilisateurId || null }),
      });
      setSuccess("Association mise à jour et journalisée (F05, F07).");
      setTimeout(onFait, 600);
    } catch (err) {
      setError(err);
      setCharge(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <p className="text-sm text-slate-600">
        Affilier <strong>{equipement.numero_machine}</strong> à un utilisateur du parc :
      </p>
      <Select
        value={utilisateurId}
        onChange={(e) => setUtilisateurId(e.target.value)}
      >
        <option value="">— Retirer l&apos;association —</option>
        {utilisateurs.map((u) => (
          <option key={u.id} value={u.id}>
            {u.prenom} {u.nom} — {u.email} ({u.societe})
          </option>
        ))}
      </Select>
      <FormMessage message={message} tone={tone} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onFait}>Annuler</Button>
        <Button type="submit" disabled={charge}>
          {charge ? "Enregistrement…" : "Associer"}
        </Button>
      </div>
    </form>
  );
}