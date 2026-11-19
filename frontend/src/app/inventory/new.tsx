import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FixedTopBand } from '@/components/fixed-top-band';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import type { Brand } from '@/features/brands/brand-types';
import { conditions, stylesList } from '@/features/inventory/piece-attributes';
import {
  pieceDraftKey,
  readPieceDraft,
  removePieceDraft,
  savePieceDraft,
  type PieceDraft,
} from '@/features/inventory/piece-draft';
import { useStores } from '@/features/stores/store-context';
import { systemBrands } from '@/mocks/fixtures/brands';
import { mockBrandService } from '@/services/mock/mock-brand-service';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { storeService } from '@/services';
import { cardSurface } from '@/theme/card';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { layout } from '@/theme/spacing';
import { fontFamilies, fontSizes } from '@/theme/typography';
import type {
  Category,
  PieceCondition,
  PieceStatus,
  PieceStyle,
} from '@/types/models';

const statuses: { value: PieceStatus; label: string }[] = [
  { value: 'available', label: 'Livre' },
  { value: 'reserved', label: 'Reservada' },
  { value: 'clearance', label: 'Liquidação' },
  { value: 'sold', label: 'Vendida' },
];
const defaultBrandId =
  systemBrands.find((brand) => brand.tier === 'other')?.id ?? '';

function todayPtBr() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  )
    return null;
  return `${year}-${month}-${day}`;
}

function parseMoney(value: string) {
  const raw = value.trim().replace(/\s|R\$/g, '');
  const normalized = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw)
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export default function NewPieceScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { user } = useAuth();
  const {
    activeStore,
    activePieces,
    createPiece,
    updatePiece,
    loading: storesLoading,
  } = useStores();
  const editingPiece = editId
    ? activePieces.find((item) => item.id === editId)
    : undefined;
  const { heroHeight, heroCardTop, contentWidth, cardPadding } =
    useResponsiveLayout();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [code, setCode] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoActions, setPhotoActions] = useState(false);
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState(defaultBrandId);
  const [condition, setCondition] = useState<PieceCondition>('excellent');
  const [style, setStyle] = useState<PieceStyle>('casual');
  const [acquisitionPrice, setAcquisitionPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [acquisitionPlace, setAcquisitionPlace] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState(todayPtBr);
  const [collection, setCollection] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<PieceStatus>('available');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftKey =
    user && activeStore ? pieceDraftKey(user.id, activeStore.id, editId) : null;
  const [readyDraftKey, setReadyDraftKey] = useState<string | null>(null);
  const pendingDraftWrites = useRef<Promise<void>>(Promise.resolve());
  const savedRef = useRef(false);

  useEffect(() => {
    if (!draftKey) return;
    let live = true;
    savedRef.current = false;
    readPieceDraft(draftKey)
      .then((draft) => {
        if (!live) return;
        const previous = editId ? editingPiece : undefined;
        setPhotoUri(draft?.photoUri ?? previous?.photoUri ?? null);
        setName(draft?.name ?? previous?.name ?? '');
        setSize(draft?.size ?? previous?.size ?? '');
        setCategoryId(draft?.categoryId ?? previous?.categoryId ?? '');
        setBrandId(draft?.brandId ?? previous?.brandId ?? defaultBrandId);
        setCondition(draft?.condition ?? previous?.condition ?? 'excellent');
        setStyle(draft?.style ?? previous?.style ?? 'casual');
        setAcquisitionPrice(
          draft?.acquisitionPrice ??
            (previous?.acquisitionPrice !== undefined
              ? String(previous.acquisitionPrice).replace('.', ',')
              : ''),
        );
        setQuantity(draft?.quantity ?? String(previous?.quantity ?? 1));
        setAcquisitionPlace(
          draft?.acquisitionPlace ?? previous?.acquisitionPlace ?? '',
        );
        setAcquisitionDate(
          draft?.acquisitionDate ??
            (previous?.acquisitionDate
              ? previous.acquisitionDate.split('-').reverse().join('/')
              : todayPtBr()),
        );
        setCollection(draft?.collection ?? previous?.collection ?? '');
        setNotes(draft?.notes ?? previous?.notes ?? '');
        setStatus(draft?.status ?? previous?.status ?? 'available');
        setSubmitted(false);
        setReadyDraftKey(draftKey);
      })
      .catch(() => {
        if (live) {
          setError('Não foi possível recuperar o rascunho da peça.');
          setReadyDraftKey(draftKey);
        }
      });
    return () => {
      live = false;
    };
  }, [draftKey, editId, editingPiece]);

  useEffect(() => {
    if (!draftKey || readyDraftKey !== draftKey || savedRef.current) return;
    const draft: PieceDraft = {
      photoUri,
      name,
      size,
      categoryId,
      brandId,
      condition,
      style,
      acquisitionPrice,
      quantity,
      acquisitionPlace,
      acquisitionDate,
      collection,
      notes,
      status,
    };
    pendingDraftWrites.current = pendingDraftWrites.current
      .catch(() => undefined)
      .then(() => savePieceDraft(draftKey, draft));
    void pendingDraftWrites.current.catch(() => {
      setError('Não foi possível guardar o rascunho neste dispositivo.');
    });
  }, [
    draftKey,
    readyDraftKey,
    photoUri,
    name,
    size,
    categoryId,
    brandId,
    condition,
    style,
    acquisitionPrice,
    quantity,
    acquisitionPlace,
    acquisitionDate,
    collection,
    notes,
    status,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let live = true;
      Promise.all([
        mockCategoryService.list(user.id),
        mockBrandService.list(user.id),
        storeService.nextPieceCode(user.id),
      ])
        .then(([nextCategories, nextBrands, nextCode]) => {
          if (!live) return;
          setCategories(nextCategories);
          setBrands(nextBrands);
          setCode(editId ? (editingPiece?.code ?? 'Ao salvar') : nextCode);
          setBrandId(
            (current) =>
              current ||
              nextBrands.find((brand) => brand.tier === 'other')?.id ||
              '',
          );
        })
        .catch((cause) => {
          if (live)
            setError(
              cause instanceof Error
                ? cause.message
                : 'Não foi possível carregar as opções.',
            );
        });
      return () => {
        live = false;
      };
    }, [user, editId, editingPiece?.code]),
  );

  async function pickPhoto(source: 'camera' | 'library') {
    setPhotoActions(false);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted)
          throw new Error('Autorize o acesso à câmera para tirar a foto.');
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            });
      if (!result.canceled && result.assets[0]?.uri)
        setPhotoUri(result.assets[0].uri);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível escolher a foto.',
      );
    }
  }

  async function save(thenPrice: boolean) {
    if (saving) return;
    setSubmitted(true);
    setError(null);
    const price = parseMoney(acquisitionPrice);
    const count = /^\d+$/.test(quantity.trim())
      ? Number(quantity.trim())
      : null;
    const date = parseDate(acquisitionDate);
    if (!activeStore)
      return setError('Selecione uma loja para cadastrar a peça.');
    if (readyDraftKey !== draftKey)
      return setError('Aguarde o carregamento do rascunho antes de cadastrar.');
    if (
      !name.trim() ||
      name.trim().length > 80 ||
      !categoryId ||
      !categories.some((item) => item.id === categoryId) ||
      !brandId ||
      !brands.some((item) => item.id === brandId) ||
      price === null ||
      price < 0 ||
      price > 1_000_000_000 ||
      count === null ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 999_999 ||
      !date
    )
      return;
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        photoUri,
        size: size.trim(),
        categoryId,
        brandId,
        condition,
        style,
        acquisitionPrice: price,
        quantity: count,
        acquisitionPlace: acquisitionPlace.trim(),
        acquisitionDate: date,
        collection: collection.trim(),
        notes: notes.trim(),
        status,
      };
      const piece = editId
        ? await updatePiece(editId, input)
        : await createPiece(input);
      savedRef.current = true;
      await pendingDraftWrites.current.catch(() => undefined);
      if (draftKey) await removePieceDraft(draftKey).catch(() => undefined);
      if (thenPrice)
        router.replace({
          pathname: '/inventory/price',
          params: { pieceId: piece.id },
        });
      else
        router.replace({
          pathname: '/inventory/detail',
          params: { pieceId: piece.id, saved: editId ? 'updated' : 'created' },
        });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível cadastrar a peça.',
      );
    } finally {
      setSaving(false);
    }
  }

  function choices<T extends string>(
    items: readonly { value: T; label: string }[],
    value: T,
    onChange: (next: T) => void,
  ) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.choices}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === item.value }}
            onPress={() => onChange(item.value)}
            style={[s.chip, value === item.value && s.chipSelected]}
          >
            <Text
              style={[s.chipLabel, value === item.value && s.chipLabelSelected]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <FixedTopBand height={heroHeight} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[s.hero, { height: heroHeight }]}>
            <View style={s.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar ao estoque"
                onPress={() =>
                  editId
                    ? router.replace({
                        pathname: '/inventory/detail',
                        params: { pieceId: editId },
                      })
                    : router.replace('/inventory')
                }
                style={s.back}
              >
                <SymbolView
                  name={{
                    ios: 'chevron.left',
                    android: 'arrow_back',
                    web: 'arrow_back',
                  }}
                  size={layout.headerIcon}
                  tintColor={colors.action.secondary}
                />
              </Pressable>
              <View>
                <Text accessibilityRole="header" style={s.title}>
                  {editId ? 'Editar peça' : 'Nova peça'}
                </Text>
                {activeStore ? (
                  <Text style={s.storeName}>Loja: {activeStore.name}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {!draftKey ? (
            storesLoading ? (
              <LoadingState message="Carregando loja..." />
            ) : (
              <EmptyState
                title="Selecione uma loja"
                message="Escolha uma loja ativa para cadastrar a peça."
                actionLabel="Minhas lojas"
                onAction={() => router.replace('/stores')}
              />
            )
          ) : editId && !editingPiece ? (
            <EmptyState
              title="Peça não encontrada"
              message="Esta peça não pertence à loja ativa."
              actionLabel="Voltar ao estoque"
              onAction={() => router.replace('/inventory')}
            />
          ) : readyDraftKey !== draftKey ? (
            <LoadingState message="Carregando rascunho..." />
          ) : (
            <>
              <View
                style={[
                  s.card,
                  {
                    width: contentWidth,
                    padding: cardPadding,
                    marginTop: heroCardTop - heroHeight,
                  },
                ]}
              >
                <View style={s.section}>
                  <Text style={s.label}>Foto</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      photoUri
                        ? 'Alterar foto da peça'
                        : 'Tirar ou escolher foto da peça'
                    }
                    onPress={() => setPhotoActions(true)}
                    style={s.photo}
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={s.photoImage} />
                    ) : (
                      <View style={s.photoCenter}>
                        <SymbolView
                          name={{
                            ios: 'camera',
                            android: 'photo_camera',
                            web: 'photo_camera',
                          }}
                          size={25}
                          tintColor={colors.text.secondary}
                        />
                        <Text style={s.photoText}>Tirar ou escolher foto</Text>
                        <Text style={s.photoOptional}>Opcional</Text>
                      </View>
                    )}
                  </Pressable>
                  <Text style={s.helper}>
                    Opcional — você pode cadastrar sem foto e adicionar depois.
                  </Text>
                  {photoActions ? (
                    <View style={s.photoActions}>
                      <AppButton
                        title="Tirar foto"
                        onPress={() => pickPhoto('camera')}
                        variant="secondary"
                        size="small"
                      />
                      <AppButton
                        title="Escolher da galeria"
                        onPress={() => pickPhoto('library')}
                        variant="secondary"
                        size="small"
                      />
                      {photoUri ? (
                        <AppButton
                          title="Remover foto"
                          onPress={() => {
                            setPhotoUri(null);
                            setPhotoActions(false);
                          }}
                          variant="ghost"
                          size="small"
                        />
                      ) : null}
                      <AppButton
                        title="Fechar"
                        onPress={() => setPhotoActions(false)}
                        variant="ghost"
                        size="small"
                      />
                    </View>
                  ) : null}
                </View>
                <AppTextField
                  label="Nome"
                  placeholder="Ex.: Blazer de linho"
                  value={name}
                  onChangeText={setName}
                  maxLength={80}
                  error={
                    submitted && !name.trim()
                      ? 'Informe o nome da peça.'
                      : undefined
                  }
                />
                <View style={s.twoColumns}>
                  <View style={s.column}>
                    <AppTextField
                      label="Código"
                      value={code || 'Gerando...'}
                      editable={false}
                      helperText="Gerado pelo sistema"
                    />
                  </View>
                  <View style={s.column}>
                    <AppTextField
                      label="Tamanho"
                      placeholder="Ex.: M"
                      value={size}
                      onChangeText={setSize}
                      maxLength={20}
                    />
                  </View>
                </View>
                <View style={s.section}>
                  <Text style={s.label}>Categoria</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.choices}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname: '/profile/categories/new',
                          params: { fromPiece: '1' },
                        })
                      }
                      style={s.chip}
                    >
                      <Text style={s.chipLabel}>+ Nova</Text>
                    </Pressable>
                    {categories.map((item) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: categoryId === item.id,
                        }}
                        onPress={() => setCategoryId(item.id)}
                        style={[
                          s.chip,
                          categoryId === item.id && s.chipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            s.chipLabel,
                            categoryId === item.id && s.chipLabelSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {submitted &&
                  !categories.some((item) => item.id === categoryId) ? (
                    <Text style={s.errorText}>Selecione uma categoria.</Text>
                  ) : null}
                </View>
                <View style={s.section}>
                  <Text style={s.label}>Marca</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.choices}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname: '/profile/brands/new',
                          params: { fromPiece: '1' },
                        })
                      }
                      style={s.chip}
                    >
                      <Text style={s.chipLabel}>+ Nova</Text>
                    </Pressable>
                    {brands
                      .filter((brand) => brand.tier !== 'other')
                      .map((brand) => (
                        <Pressable
                          key={brand.id}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: brandId === brand.id,
                          }}
                          onPress={() => setBrandId(brand.id)}
                          style={[
                            s.chip,
                            brandId === brand.id && s.chipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              s.chipLabel,
                              brandId === brand.id && s.chipLabelSelected,
                            ]}
                          >
                            {brand.name}
                          </Text>
                        </Pressable>
                      ))}
                    {brands
                      .filter((brand) => brand.tier === 'other')
                      .map((brand) => (
                        <Pressable
                          key={brand.id}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: brandId === brand.id,
                          }}
                          onPress={() => setBrandId(brand.id)}
                          style={[
                            s.chip,
                            brandId === brand.id && s.chipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              s.chipLabel,
                              brandId === brand.id && s.chipLabelSelected,
                            ]}
                          >
                            {brand.name}
                          </Text>
                        </Pressable>
                      ))}
                  </ScrollView>
                  {submitted && !brands.some((item) => item.id === brandId) ? (
                    <Text style={s.errorText}>Selecione uma marca.</Text>
                  ) : null}
                </View>
                <View style={s.section}>
                  <Text style={s.label}>Estado de conservação</Text>
                  {choices(conditions, condition, setCondition)}
                </View>
                <View style={s.section}>
                  <Text style={s.label}>Estilo</Text>
                  {choices(stylesList, style, setStyle)}
                </View>
              </View>

              <View
                style={[s.card, { width: contentWidth, padding: cardPadding }]}
              >
                <View style={s.twoColumns}>
                  <View style={s.column}>
                    <AppTextField
                      label="Preço de aquisição (R$)"
                      placeholder="0,00"
                      value={acquisitionPrice}
                      onChangeText={setAcquisitionPrice}
                      keyboardType="decimal-pad"
                      error={
                        submitted &&
                        (parseMoney(acquisitionPrice) === null ||
                          (parseMoney(acquisitionPrice) ?? 0) > 1_000_000_000)
                          ? 'Informe um valor válido.'
                          : undefined
                      }
                    />
                  </View>
                  <View style={s.column}>
                    <AppTextField
                      label="Quantidade"
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="number-pad"
                      error={
                        submitted &&
                        (!/^\d+$/.test(quantity.trim()) ||
                          Number(quantity) < 1 ||
                          Number(quantity) > 999_999)
                          ? 'Informe de 1 a 999.999.'
                          : undefined
                      }
                    />
                  </View>
                </View>
                <AppTextField
                  label="Local de aquisição"
                  placeholder="Ex.: Feira do Bixiga, SP"
                  value={acquisitionPlace}
                  onChangeText={setAcquisitionPlace}
                  maxLength={100}
                />
                <AppTextField
                  label="Data da aquisição"
                  placeholder="DD/MM/AAAA"
                  value={acquisitionDate}
                  onChangeText={setAcquisitionDate}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  error={
                    submitted && !parseDate(acquisitionDate)
                      ? 'Use uma data válida (DD/MM/AAAA).'
                      : undefined
                  }
                />
                <AppTextField
                  label="Coleção"
                  placeholder="Ex.: Verão 26"
                  value={collection}
                  onChangeText={setCollection}
                  maxLength={80}
                />
                <AppTextField
                  label="Observações"
                  placeholder="Detalhes, defeitos, medidas..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  style={s.notes}
                />
                <View style={s.section}>
                  <Text style={s.label}>Status</Text>
                  <View style={s.statusGrid}>
                    {statuses.map((item) => (
                      <Pressable
                        key={item.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected: status === item.value }}
                        onPress={() => setStatus(item.value)}
                        style={[
                          s.statusChip,
                          status === item.value && s.chipSelected,
                        ]}
                      >
                        <View
                          style={[
                            s.statusDot,
                            status === item.value && s.statusDotSelected,
                          ]}
                        />
                        <Text
                          style={[
                            s.chipLabel,
                            status === item.value && s.chipLabelSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {error ? (
                  <AppFeedback
                    compact
                    variant="error"
                    title={error}
                    onDismiss={() => setError(null)}
                  />
                ) : null}
                <AppButton
                  title={editId ? 'Salvar alterações' : 'Cadastrar peça'}
                  onPress={() => save(false)}
                  loading={saving}
                />
                <AppButton
                  title={
                    editId ? 'Salvar e precificar' : 'Cadastrar e precificar'
                  }
                  onPress={() => save(true)}
                  variant="secondary"
                  disabled={saving}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  flex: { flex: 1 },
  content: { alignItems: 'center', paddingBottom: 32, gap: 14 },
  hero: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: layout.screenTop,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: {
    width: layout.headerButton,
    height: layout.headerButton,
    borderRadius: layout.headerButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.primary,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.screenTitle,
    color: colors.text.primary,
  },
  storeName: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  card: {
    ...cardSurface,
    maxWidth: 420,
    borderRadius: 19,
    gap: 16,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  section: { gap: 8 },
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    color: colors.text.primary,
  },
  helper: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.text.auxiliary,
  },
  photo: {
    height: 180,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoCenter: { alignItems: 'center', gap: 5 },
  photoImage: { width: '100%', height: '100%' },
  photoText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  photoOptional: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    color: colors.action.secondary,
    textTransform: 'uppercase',
  },
  photoActions: { gap: 7 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, minWidth: 0 },
  choices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.primary,
  },
  chipSelected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  chipLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  chipLabelSelected: {
    color: colors.text.inverse,
    fontFamily: fontFamilies.sansMedium,
  },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  statusChip: {
    width: '48%',
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.default,
  },
  statusDotSelected: { backgroundColor: colors.brand.terracotta },
  notes: { minHeight: 75, textAlignVertical: 'top' },
  errorText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.semantic.error.foreground,
  },
});
