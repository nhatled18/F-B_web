// components/TransactionHistory.jsx
// components/TransactionHistory.jsx
function TransactionHistory({ transactions, products }) {
  const getProductInfo = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { name: 'Unknown', sku: '', group: '' };
    return {
      name: product.productName,
      sku: product.sku,
      group: product.group
    };
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Lịch sử giao dịch</h3>
      </div>
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {transactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
            Chưa có giao dịch nào
          </p>
        ) : (
          transactions.slice().reverse().map(trans => {
            const productInfo = getProductInfo(trans.productId);
            return (
              <div key={trans.id} className="transaction-item">
                <div className="transaction-info">
                  <h4>{productInfo.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                    SKU: {productInfo.sku}
                    {productInfo.group && ` | ${productInfo.group}`}
                  </p>
                  <p>{trans.note}</p>
                  <span
                    className={`badge ${trans.type === 'import' ? 'badge-green' : 'badge-red'}`}
                  >
                    {trans.type === 'import' ? 'Nhập kho' : 'Xuất kho'}
                  </span>
                </div>
                <div className="transaction-value">
                  <div
                    className="amount"
                    style={{ color: trans.type === 'import' ? '#10b981' : '#ef4444' }}
                  >
                    {trans.type === 'import' ? '+' : '-'}{trans.quantity}
                  </div>
                  <div className="date">{trans.date}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;