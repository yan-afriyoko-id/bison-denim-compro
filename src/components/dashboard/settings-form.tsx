'use client';

import { useState, useTransition, type ReactNode } from 'react';
import type { GroupedSiteSettings } from '@/types';
import { updateSettingsSection } from '@/actions/settings.actions';
import { ImageInput } from '@/components/dashboard/image-input';
import { toast } from 'sonner';

type SettingsSectionKey = 'brand' | 'company' | 'contact';

const SECTION_ITEMS: Array<{
  key: SettingsSectionKey;
  label: string;
  description: string;
}> = [
  { key: 'brand', label: 'Brand', description: 'Nama situs dan logo utama.' },
  { key: 'company', label: 'Company', description: 'Deskripsi utama perusahaan.' },
  { key: 'contact', label: 'Contact', description: 'Email, telepon, dan alamat.' },
];

export function SettingsForm({
  initialSettings,
  initialVisibility,
}: {
  initialSettings: GroupedSiteSettings;
  initialVisibility: Record<string, boolean>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('brand');
  const [savingSection, setSavingSection] = useState<SettingsSectionKey | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateGroup<K extends keyof GroupedSiteSettings>(group: K, key: keyof GroupedSiteSettings[K], value: string) {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  }

  function updateLogo(value: string) {
    setSettings((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        logo: value,
      },
    }));
  }

  function toggleVisibility(key: string) {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function saveSection(section: SettingsSectionKey) {
    setSavingSection(section);
    startTransition(async () => {
      const valuesBySection: Record<SettingsSectionKey, Record<string, string>> = {
        brand: settings.brand as unknown as Record<string, string>,
        company: settings.company as unknown as Record<string, string>,
        contact: settings.contact as unknown as Record<string, string>,
      };

      const visibilityBySection: Record<string, Record<string, boolean>> = {
        brand: {
          site_name: visibility.site_name ?? true,
          logo: visibility.logo ?? true,
        },
        company: {
          site_description: visibility.site_description ?? true,
          footer_description: visibility.footer_description ?? true,
        },
        contact: {
          contact_email: visibility.contact_email ?? true,
          contact_phone: visibility.contact_phone ?? true,
          contact_address: visibility.contact_address ?? true,
        },
      };

      const result = await updateSettingsSection({
        section,
        values: valuesBySection[section],
        visibility: visibilityBySection[section],
      });

      setSavingSection(null);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`${SECTION_ITEMS.find((item) => item.key === section)?.label} berhasil disimpan`);
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Pengaturan situs dalam panel terpisah per kategori.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-sm border border-gray-200 bg-white p-2">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {SECTION_ITEMS.map((item) => {
              const isActive = activeSection === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`rounded-sm border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  <div className="text-sm font-bold">{item.label}</div>
                  <p className={`mt-1 text-xs leading-relaxed ${isActive ? 'text-white/75' : 'text-gray-400'}`}>
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6">
          {activeSection === 'brand' && (
            <SectionCard
              title="Brand"
              description="Atur identitas merek yang dipakai di header, footer, dan elemen public lainnya."
              onSave={() => saveSection('brand')}
              saving={isPending && savingSection === 'brand'}
            >
              <TextField label="Site Name" value={settings.brand.site_name} onChange={(value) => updateGroup('brand', 'site_name', value)} />
              <ImageInput
                name="logo"
                label="Logo"
                defaultValue={settings.brand.logo}
                onChange={updateLogo}
                aspectClass="aspect-[3/1]"
                wrapperClassName="w-[220px]"
                hint="Logo ini dipakai di header, footer, dan seluruh halaman publik"
              />
              <VisibilityToggle label="Site Name Public" checked={visibility.site_name ?? true} onChange={() => toggleVisibility('site_name')} />
              <VisibilityToggle label="Logo Public" checked={visibility.logo ?? true} onChange={() => toggleVisibility('logo')} />
            </SectionCard>
          )}

          {activeSection === 'company' && (
            <SectionCard
              title="Company"
              description="Kelola deskripsi utama yang dipakai di halaman public dan footer."
              onSave={() => saveSection('company')}
              saving={isPending && savingSection === 'company'}
            >
              <TextareaField label="Site Description" value={settings.company.site_description} onChange={(value) => updateGroup('company', 'site_description', value)} />
              <TextareaField label="Footer Description" value={settings.company.footer_description} onChange={(value) => updateGroup('company', 'footer_description', value)} />
              <VisibilityToggle label="Site Description Public" checked={visibility.site_description ?? true} onChange={() => toggleVisibility('site_description')} />
              <VisibilityToggle label="Footer Description Public" checked={visibility.footer_description ?? true} onChange={() => toggleVisibility('footer_description')} />
            </SectionCard>
          )}

          {activeSection === 'contact' && (
            <SectionCard
              title="Contact"
              description="Data kontak ini dipakai di footer, CTA, dan halaman kontak."
              onSave={() => saveSection('contact')}
              saving={isPending && savingSection === 'contact'}
            >
              <TextField label="Contact Email" value={settings.contact.contact_email} onChange={(value) => updateGroup('contact', 'contact_email', value)} />
              <TextField label="Contact Phone" value={settings.contact.contact_phone} onChange={(value) => updateGroup('contact', 'contact_phone', value)} />
              <TextareaField label="Contact Address" value={settings.contact.contact_address} onChange={(value) => updateGroup('contact', 'contact_address', value)} />
              <VisibilityToggle label="Contact Email Public" checked={visibility.contact_email ?? true} onChange={() => toggleVisibility('contact_email')} />
              <VisibilityToggle label="Contact Phone Public" checked={visibility.contact_phone ?? true} onChange={() => toggleVisibility('contact_phone')} />
              <VisibilityToggle label="Contact Address Public" checked={visibility.contact_address ?? true} onChange={() => toggleVisibility('contact_address')} />
            </SectionCard>
          )}

        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  onSave,
  saving,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-sm border border-gray-200 bg-white p-5">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="space-y-4 pt-5">{children}</div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : `Simpan ${title}`}
        </button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
      />
    </div>
  );
}

function VisibilityToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-gray-900" />
      {label}
    </label>
  );
}
