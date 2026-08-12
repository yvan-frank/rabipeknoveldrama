'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { DocumentUploadField } from './DocumentUploadField';
import { COUNTRY_OPTIONS, documentTypeOptions, kycFormSchema, toKycApiPayload, type KycFormValues } from '@/lib/schemas/kyc';
import type { ApiResponse, AuthorKycStatus } from '@/types/api';

const inputClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-amber/50 dark:border-white/20';
const labelClass = 'text-xs font-medium text-black/60 dark:text-white/60';

const DEFAULT_VALUES: KycFormValues = {
  fullName: '',
  country: '',
  address: '',
  documentType: 'cni',
  documentId: '',
  documents: '',
  facebook: '',
  instagram: '',
  twitter: '',
  website: '',
  privacyAccepted: false,
};

export function KycForm() {
  const queryClient = useQueryClient();

  const kycQuery = useQuery({
    queryKey: ['author', 'kyc'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuthorKycStatus>>('/authors/moi/kyc');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: DEFAULT_VALUES,
    // Se resynchronise dès que les données serveur arrivent (contrairement à
    // defaultValues, figé au montage) — utile ici puisque le formulaire est
    // pré-rempli avec des données chargées de façon asynchrone.
    values: kycQuery.data?.extension
      ? {
          fullName: kycQuery.data.extension.fullName ?? '',
          country: kycQuery.data.extension.country ?? '',
          address: kycQuery.data.extension.address ?? '',
          documentType: kycQuery.data.extension.documentType ?? 'cni',
          documentId: kycQuery.data.extension.documentId ?? '',
          documents: kycQuery.data.extension.documents ?? '',
          facebook: kycQuery.data.extension.socialLinks?.facebook ?? '',
          instagram: kycQuery.data.extension.socialLinks?.instagram ?? '',
          twitter: kycQuery.data.extension.socialLinks?.twitter ?? '',
          website: kycQuery.data.extension.socialLinks?.website ?? '',
          privacyAccepted: Boolean(kycQuery.data.extension.privacyAcceptedAt),
        }
      : undefined,
  });

  const submitKyc = useMutation({
    mutationFn: async (values: KycFormValues) => {
      const { data } = await apiClient.post<ApiResponse<unknown>>('/authors/moi/kyc', toKycApiPayload(values));
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author', 'kyc'] });
    },
  });

  const documents = watch('documents');
  const isVerified = Boolean(kycQuery.data?.isVerified);

  if (kycQuery.isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />;

  return (
    <div className="flex flex-col gap-6">
      {isVerified ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} />
          Votre identité est vérifiée — vous pouvez gérer vos livres librement. Vos informations sont verrouillées ;
          contactez un administrateur si vous devez les modifier.
        </div>
      ) : (
        kycQuery.data?.isComplete && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <CheckCircle2 size={16} />
            KYC soumis — en attente de vérification par un administrateur.
          </div>
        )
      )}

      <form
        onSubmit={handleSubmit((values) => submitKyc.mutate(values))}
        className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/15"
      >
        {/* `disabled` sur un <fieldset> désactive nativement tous les contrôles
            de formulaire descendants (inputs, select, checkbox, boutons) — une
            fois vérifié, plus aucune modification n'est possible sans repasser
            par un nouvel examen administrateur (cf. authors.service.ts, submitKyc
            réinitialise kycVerifiedAt à chaque soumission). */}
        <fieldset disabled={isVerified} className={`flex flex-col gap-4 ${isVerified ? 'opacity-70' : ''}`}>
          <div>
            <label className={labelClass}>Nom complet</label>
            <input {...register('fullName')} className={`mt-1 ${inputClass}`} />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Pays</label>
              <div className="mt-1">
                <Select options={COUNTRY_OPTIONS} {...register('country')} />
              </div>
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Adresse</label>
              <input {...register('address')} className={`mt-1 ${inputClass}`} />
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Type de pièce d&apos;identité</label>
              <div className="mt-1">
                <Select options={documentTypeOptions} {...register('documentType')} />
              </div>
              {errors.documentType && <p className="mt-1 text-xs text-red-600">{errors.documentType.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Numéro du document</label>
              <input {...register('documentId')} className={`mt-1 ${inputClass}`} />
              {errors.documentId && <p className="mt-1 text-xs text-red-600">{errors.documentId.message}</p>}
            </div>
          </div>

          <DocumentUploadField
            value={documents}
            onChange={(url) => setValue('documents', url, { shouldValidate: true })}
            error={errors.documents?.message}
            disabled={isVerified}
          />

          <div className="rounded-xl border border-black/8 p-4 dark:border-white/10">
            <p className="mb-3 text-xs font-semibold tracking-wide text-black/45 uppercase dark:text-white/45">Réseaux sociaux (facultatif)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Facebook</label>
                <input {...register('facebook')} placeholder="https://facebook.com/…" className={`mt-1 ${inputClass}`} />
                {errors.facebook && <p className="mt-1 text-xs text-red-600">{errors.facebook.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Instagram</label>
                <input {...register('instagram')} placeholder="https://instagram.com/…" className={`mt-1 ${inputClass}`} />
                {errors.instagram && <p className="mt-1 text-xs text-red-600">{errors.instagram.message}</p>}
              </div>
              <div>
                <label className={labelClass}>X / Twitter</label>
                <input {...register('twitter')} placeholder="https://x.com/…" className={`mt-1 ${inputClass}`} />
                {errors.twitter && <p className="mt-1 text-xs text-red-600">{errors.twitter.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Site web</label>
                <input {...register('website')} placeholder="https://…" className={`mt-1 ${inputClass}`} />
                {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <Switch label="J'accepte la politique de confidentialité" registration={register('privacyAccepted')} />
            <Link href="/politique-confidentialite" target="_blank" className="mt-1.5 inline-block text-xs text-brand-amber hover:underline">
              Lire la politique de confidentialité
            </Link>
            {errors.privacyAccepted && <p className="mt-1 text-xs text-red-600">{errors.privacyAccepted.message}</p>}
          </div>
        </fieldset>

        {submitKyc.isError && (
          <p className="text-xs text-red-600">{extractApiErrorMessage(submitKyc.error, "Impossible d'enregistrer votre KYC")}</p>
        )}
        {submitKyc.isSuccess && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Informations enregistrées.</p>}

        {!isVerified && (
          <button
            type="submit"
            disabled={submitKyc.isPending}
            className="self-start rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {submitKyc.isPending ? 'Enregistrement…' : 'Soumettre mon KYC'}
          </button>
        )}
      </form>
    </div>
  );
}
