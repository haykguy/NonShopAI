import { useEffect, useState } from 'react';
import { Loader2, ChevronRight, Package } from 'lucide-react';
import type { Product } from './index';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'ca-akg',
    name: 'Ca-AKG',
    key_ingredients: 'Calcium Alpha-Ketoglutarate',
    marketing_angle:
      'Cellular longevity support that targets aging at the mitochondrial level for more energy and vitality.',
  },
  {
    id: 'nmn-boost',
    name: 'NMN Boost',
    key_ingredients: 'NMN, Resveratrol, Trans-Pterostilbene',
    marketing_angle:
      'NAD+ precursor that restores the energy metabolism of youth, fighting fatigue and brain fog.',
  },
  {
    id: 'joint-relief',
    name: 'Joint Relief Complex',
    key_ingredients: 'UC-II Collagen, Boswellia, Turmeric',
    marketing_angle:
      'Fast-acting joint comfort formula for active adults who refuse to let pain slow them down.',
  },
  {
    id: 'sleep-deep',
    name: 'Sleep Deep',
    key_ingredients: 'Magnesium Glycinate, Ashwagandha, L-Theanine',
    marketing_angle:
      'Natural sleep support that quiets the racing mind and delivers deep, restorative sleep without grogginess.',
  },
];

interface Props {
  selected: Product | null;
  onSelect: (product: Product) => void;
  onContinue: () => void;
}

export function Step2Product({ selected, onSelect, onContinue }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.products || d.data || []);
        setProducts(list.length > 0 ? list : MOCK_PRODUCTS);
      })
      .catch(() => setProducts(MOCK_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: '48px 0' }}>
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading products…</span>
      </div>
    );
  }

  const displayProducts = products.length > 0 ? products : MOCK_PRODUCTS;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 6,
            letterSpacing: '-0.01em',
          }}
        >
          Select a Product
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          This is the supplement or product your video will feature.
        </p>
      </div>

      {/* Product grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
          marginBottom: 32,
        }}
      >
        {displayProducts.map(product => {
          const isSelected = selected?.id === product.id;
          const isHovered = hoveredId === product.id;

          return (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                background: isSelected
                  ? 'rgba(168,85,247,0.10)'
                  : isHovered
                  ? 'rgba(255,255,255,0.03)'
                  : 'var(--card)',
                border: `1px solid ${
                  isSelected
                    ? '#a855f7'
                    : isHovered
                    ? 'rgba(168,85,247,0.30)'
                    : 'var(--border)'
                }`,
                borderRadius: 16,
                padding: '22px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isHovered && !isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected
                  ? '0 0 0 1px rgba(168,85,247,0.30), 0 8px 28px rgba(168,85,247,0.12)'
                  : 'none',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              {/* Icon + name row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isSelected
                      ? 'rgba(168,85,247,0.18)'
                      : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isSelected ? 'rgba(168,85,247,0.35)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  <Package
                    size={18}
                    color={isSelected ? '#a855f7' : 'var(--text-dim)'}
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                      marginBottom: 3,
                    }}
                  >
                    {product.name}
                  </div>
                  {product.key_ingredients && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {product.key_ingredients}
                    </div>
                  )}
                </div>

                {/* Selected badge */}
                {isSelected && (
                  <div
                    style={{
                      marginLeft: 'auto',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: 12 }}>✓</span>
                  </div>
                )}
              </div>

              {/* Marketing angle */}
              {product.marketing_angle && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    lineHeight: 1.65,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  "{product.marketing_angle}"
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Continue */}
      {selected && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onContinue}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            Continue with {selected.name}
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
