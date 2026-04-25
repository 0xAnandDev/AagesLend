import React from 'react';
import { useNavigate } from 'react-router-dom';

const AssetsTable = ({ assets }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto bg-black-light rounded-2xl border border-black/50 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead className="bg-black/30">
          <tr className="border-b border-black text-white text-[11px] tracking-[0.1em] uppercase font-bold">
            <th className="p-5 font-semibold w-1/4">Underlying Asset</th>
            <th className="p-5 font-semibold text-right">Supply APY</th>
            <th className="p-5 font-semibold text-right">Borrow APY</th>
            <th className="p-5 font-semibold text-right hidden md:table-cell">Total Supplied</th>
            <th className="p-5 font-semibold text-right hidden md:table-cell">Total Borrowed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/40">
          {assets.map((asset, idx) => (
            <tr 
              key={idx} 
              onClick={() => navigate('/lend')} 
              className="hover:bg-black/40 transition-colors cursor-pointer group"
            >
              <td className="p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-black border border-black shadow">
                    {asset.symbol[0]}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-gray-300 group-hover:text-white transition-colors">{asset.name}</span>
                    <span className="text-xs font-semibold text-white">{asset.symbol}</span>
                </div>
              </td>
              <td className="p-5 font-medium text-right tracking-wide">{asset.supplyApy}</td>
              <td className="p-5 font-medium text-right tracking-wide">{asset.borrowApy}</td>
              <td className="p-5 hidden md:table-cell text-white text-right tracking-wide">{asset.supplied}</td>
              <td className="p-5 hidden md:table-cell text-white text-right tracking-wide">{asset.borrowed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetsTable;
