import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppModal } from '@/components/app-modal';
import { AppSelect } from '@/components/app-select';
import { AppTextField } from '@/components/app-text-field';
import { cityOptions, states } from '@/features/stores/brazil-locations';
import { storeService } from '@/services';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';
import type { Store } from '@/types/models';

type EditStoreModalProps = {
  store: Store | null;
  ownerId: string;
  onClose: () => void;
  onSaved: (store: Store) => void;
};

export function EditStoreModal(props: EditStoreModalProps) {
  if (!props.store) return null;
  return (
    <EditStoreForm
      key={props.store.id}
      store={props.store}
      ownerId={props.ownerId}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
}

function EditStoreForm({
  store,
  ownerId,
  onClose,
  onSaved,
}: Omit<EditStoreModalProps, 'store'> & { store: Store }) {
  const [name, setName] = useState(store.name);
  const [state, setState] = useState(store.state);
  const [city, setCity] = useState(store.city);
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logoUrl);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function close() {
    if (!saving) onClose();
  }

  async function pickLogo() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setLogoUrl(result.assets[0].uri);
        setError('');
      }
    } catch {
      setError('Não foi possível escolher o logo. Tente novamente.');
    }
  }

  async function save() {
    setSubmitted(true);
    setError('');
    if (!name.trim() || !state || !city) return;
    setSaving(true);
    try {
      const updated = await storeService.update(ownerId, store.id, {
        name: name.trim(),
        state,
        city,
        logoUrl,
      });
      onSaved(updated);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível atualizar a loja.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      visible
      title="Editar loja"
      titleStyle={styles.modalTitle}
      onClose={close}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.logoSection}>
          <Text style={styles.label}>Logo da loja (opcional)</Text>
          <View style={styles.logoRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                logoUrl ? 'Alterar logo da loja' : 'Escolher logo da loja'
              }
              onPress={pickLogo}
              style={styles.logoButton}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <View pointerEvents="none">
                  <SymbolView
                    name={{
                      ios: 'photo',
                      android: 'add_photo_alternate',
                      web: 'add_photo_alternate',
                    }}
                    size={20}
                    tintColor={colors.action.secondary}
                  />
                </View>
              )}
            </Pressable>
            <Text style={styles.logoHint}>
              Toque no círculo para escolher uma imagem.
            </Text>
          </View>
          {logoUrl ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setLogoUrl(null)}
            >
              <Text style={styles.removeLogo}>Remover logo</Text>
            </Pressable>
          ) : null}
        </View>

        <AppTextField
          label="Nome da loja"
          labelStyle={styles.label}
          fieldStyle={styles.field}
          style={styles.fieldInput}
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          error={
            submitted && !name.trim() ? 'Informe o nome da loja.' : undefined
          }
        />
        <AppSelect
          compact
          label="Estado"
          options={states.map((item) => ({ ...item }))}
          value={state}
          onChange={(value) => {
            setState(value);
            setCity('');
          }}
          error={submitted && !state ? 'Selecione o estado.' : undefined}
          placeholder="Selecione o estado"
        />
        <AppSelect
          compact
          searchable
          label="Cidade"
          options={cityOptions(state)}
          value={city}
          onChange={setCity}
          disabled={!state}
          error={submitted && !city ? 'Selecione a cidade.' : undefined}
          placeholder={
            state ? 'Selecione a cidade' : 'Escolha primeiro o estado'
          }
        />

        {error ? (
          <AppFeedback
            compact
            variant="error"
            title="Não foi possível atualizar a loja"
            message={error}
            onDismiss={() => setError('')}
          />
        ) : null}
        <View style={styles.actions}>
          <AppButton
            title="Cancelar"
            variant="secondary"
            size="small"
            disabled={saving}
            onPress={close}
            style={styles.action}
            labelStyle={styles.actionLabel}
          />
          <AppButton
            title="Salvar alterações"
            size="small"
            loading={saving}
            onPress={save}
            style={styles.action}
            labelStyle={styles.actionLabel}
          />
        </View>
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    lineHeight: 24,
  },
  content: { gap: 14, paddingBottom: 4 },
  logoSection: { gap: 7 },
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.selected,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: 56, height: 56, borderRadius: 28 },
  logoHint: {
    flex: 1,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  removeLogo: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.action.secondary,
  },
  field: {
    minHeight: 38,
    borderRadius: 13,
    borderColor: colors.border.default,
  },
  fieldInput: { minHeight: 34, fontSize: 11, paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  action: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionLabel: { fontSize: 12, lineHeight: 16 },
});
