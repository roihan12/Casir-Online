import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  useBotConfigs,
  useBotStatus,
  useWhatsappChats,
  useWhatsappMessages,
  useWhatsappSendMessage,
  useWhatsappStatus,
} from '../hooks/useWhatsapp';
import { useCustomerSearch } from '../../../common/hooks/usePosQueries';
import socket from '../../../common/services/socketService';

// ─── Icons (inline SVG, no emoji, no external icon lib needed beyond existing) ─
const Icon = {
  Search: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"/>
    </svg>
  ),
  NewChat: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"/>
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
    </svg>
  ),
  Attach: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.call-7.912c.218-.217.224-.579.012-.791l-.244-.244c-.19-.19-.577-.348-.958.033l-7.906 7.907c-.82.819-1.618 2.144-1.618 3.767z"/>
    </svg>
  ),
  Emoji: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M9.153 11.603c.795 0 1.44-.88 1.44-1.962s-.645-1.96-1.44-1.96c-.795 0-1.44.878-1.44 1.96s.645 1.962 1.44 1.962zm-3.949 1.292A7.73 7.73 0 0 0 12 15.738a7.73 7.73 0 0 0 6.796-2.843c.417-.523.979-.124.622.399-1.525 2.296-3.959 3.83-7.418 3.83-3.46 0-5.894-1.534-7.418-3.83-.357-.523.205-.922.622-.399zm7.713.031c-.795 0-1.44-.88-1.44-1.962s.645-1.96 1.44-1.96c.795 0 1.44.878 1.44 1.96s-.645 1.962-1.44 1.962zm-6.671 2.42-.001.001zM12 2C6.478 2 2 6.478 2 12s4.478 10 10 10 10-4.478 10-10S17.522 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"/>
    </svg>
  ),
  Mic: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.468 2.35 8.468 4.35v7.061c0 2.001 1.53 3.531 3.531 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.0z"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 18 18" width="14" height="14" fill="currentColor">
      <path d="M17.394 5.035l-.57-.444a.434.434 0 0 0-.609.076l-6.39 8.198a.38.38 0 0 1-.577.039l-.427-.430-2.237-2.255a.434.434 0 0 0-.614-.006l-.525.52a.434.434 0 0 0-.006.614l3.187 3.21a.382.382 0 0 0 .577-.039l7.483-9.602a.434.434 0 0 0-.092-.881z"/>
    </svg>
  ),
  CheckDouble: ({ color = 'currentColor' }) => (
    <svg viewBox="0 0 18 18" width="14" height="14" fill={color}>
      <path d="M17.394 5.035l-.57-.444a.434.434 0 0 0-.609.076l-6.39 8.198a.38.38 0 0 1-.577.039l-.427-.430a.434.434 0 0 0-.614-.006l-.525.52a.434.434 0 0 0-.006.614l.968.976a1.776 1.776 0 0 0 2.553-.14L17.47 5.644a.434.434 0 0 0-.076-.609zm-4.88 0l-.57-.444a.434.434 0 0 0-.609.076L5.962 12.16l-1.051-1.017a.434.434 0 0 0-.614.006l-.525.52a.434.434 0 0 0-.007.614l1.987 2.01a.381.381 0 0 0 .577-.039l7.483-9.602a.434.434 0 0 0-.298-.617z"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19.1 17.2l-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"/>
    </svg>
  ),
  Bot: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13zm9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13zM3 21v-1a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1H3z"/>
    </svg>
  ),
  Branch: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M17 5C15.9 5 15 5.9 15 7s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7 5C5.9 5 5 5.9 5 7s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5-4c-.55 0-1 .45-1 1v2H9v1h2v2h1v-2h2v-1h-2v-2c0-.55-.45-1-1-1zm5 0v2h-2v1h2v2h1v-2h2v-1h-2V9h-1z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  ),
  Back: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizePhone = (phone = '') => {
  let p = phone.replace(/[^0-9]/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  return p;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const t = typeof timestamp === 'object' && timestamp.low != null
    ? timestamp.low
    : timestamp;
  const d = new Date(t < 1e12 ? t * 1000 : t);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatChatDate = (timestamp) => {
  if (!timestamp) return '';
  const t = typeof timestamp === 'object' && timestamp.low != null
    ? timestamp.low
    : timestamp;
  const d = new Date(t < 1e12 ? t * 1000 : t);
  if (isNaN(d)) return '';
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString('id-ID', { weekday: 'short' });
  }
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string' || name.trim() === '') return '?';
  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => (w && w[0] ? w[0].toUpperCase() : ''))
    .join('') || '?';
};

const AVATAR_COLORS = [
  '#DFD3F3', '#D3EBF3', '#D3F3E0', '#F3EDD3',
  '#F3D3D3', '#D3D3F3', '#F3D3EE', '#D3F3F3',
];
const getAvatarColor = (str = '') =>
  AVATAR_COLORS[str.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];


// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, src, size = 40, online }) => {
  const bg = getAvatarColor(name);
  const textColor = '#4a5568';
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: bg, display: src ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, fontWeight: 500,
          color: textColor, fontFamily: 'inherit',
        }}
      >
        {getInitials(name)}
      </div>
      {online !== undefined && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.27, height: size * 0.27,
          borderRadius: '50%', background: online ? '#25d366' : '#aebac1',
          border: '2px solid #111b21',
        }} />
      )}
    </div>
  );
};

// ─── BotSelector ─────────────────────────────────────────────────────────────
const BotSelector = ({ bots, selectedBotId, onSelect, status }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = bots.find(b => b.bot_config_id === selectedBotId);
  const isConnected = status?.state === 'connected';

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: open ? '#2a3942' : 'transparent',
          border: 'none', borderRadius: 8, padding: '6px 10px',
          cursor: 'pointer', color: '#e9edef', transition: 'background .15s',
        }}
        onMouseEnter={e => !open && (e.currentTarget.style.background = '#1f2c34')}
        onMouseLeave={e => !open && (e.currentTarget.style.background = 'transparent')}
      >
        {/* Status dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.Bot />
          </div>
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 9, height: 9, borderRadius: '50%',
            background: isConnected ? '#25d366' : '#aebac1',
            border: '2px solid #111b21',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#e9edef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selected?.name || 'Pilih Bot'}
          </div>
          {selected && (
            <div style={{ fontSize: 11, color: '#8696a0', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <Icon.Branch />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.nama_cabang || selected.cabang_id || '—'}
              </span>
            </div>
          )}
        </div>

        <span style={{ color: '#8696a0', flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <Icon.ChevronDown />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#233138', borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(0,0,0,0.4)', zIndex: 100,
          border: '0.5px solid rgba(134,150,160,0.2)',
        }}>
          <div style={{ padding: '6px 12px 4px', fontSize: 11, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '.6px' }}>
            Pilih Bot / Cabang
          </div>
          {bots.map(bot => {
            const active = bot.bot_config_id === selectedBotId;
            return (
              <button
                key={bot.bot_config_id}
                onClick={() => { onSelect(bot.bot_config_id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px',
                  background: active ? '#2a3942' : 'transparent',
                  border: 'none', cursor: 'pointer', transition: 'background .12s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = '#1f2c34')}
                onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: getAvatarColor(bot.name.substring(0, 3)),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 500, color: '#4a5568', flexShrink: 0,
                }}>
                  {bot.name.substring(0, 3)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e9edef', marginBottom: 2 }}>{bot.name}</div>
                  <div style={{ fontSize: 11, color: '#8696a0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Branch />
                    {bot.nama_cabang || bot.cabang_id}
                    {bot.is_active && (
                      <span style={{ marginLeft: 4, background: '#1faa61', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 600, letterSpacing: '.3px' }}>
                        AKTIF
                      </span>
                    )}
                  </div>
                </div>
                {active && (
                  <span style={{ color: '#25d366', flexShrink: 0 }}>
                    <Icon.Check />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── ChatListItem ─────────────────────────────────────────────────────────────
const ChatListItem = ({ contact, selected, onClick }) => {
  const lastMsg = contact.lastMessage?.conversation
    || contact.lastMessage?.extendedTextMessage?.text
    || '';
  const ts = contact.conversationTimestamp?.low || contact.conversationTimestamp;
  const unread = contact.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '10px 16px',
        background: selected ? '#2a3942' : 'transparent',
        border: 'none', cursor: 'pointer',
        borderBottom: '0.5px solid rgba(134,150,160,0.15)',
        transition: 'background .12s', textAlign: 'left',
      }}
      onMouseEnter={e => !selected && (e.currentTarget.style.background = '#1f2c34')}
      onMouseLeave={e => !selected && (e.currentTarget.style.background = 'transparent')}
    >
      <Avatar
        name={contact.name || contact.jid?.replace('@s.whatsapp.net', '')}
        src={contact.avatar}
        size={48}
      />
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {contact.name || contact.jid?.replace('@s.whatsapp.net', '')}
          </span>
          <span style={{ fontSize: 11, color: unread > 0 ? '#25d366' : '#8696a0', flexShrink: 0, marginLeft: 6 }}>
            {formatChatDate(ts)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, margin: 0 }}>
            {lastMsg || '\u00a0'}
          </p>
          {unread > 0 && (
            <span style={{
              marginLeft: 6, background: '#25d366', color: '#111b21',
              fontSize: 11, fontWeight: 600, minWidth: 20, height: 20,
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 5px', flexShrink: 0,
            }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, prevMsg, showDate }) => {
  const isMe = msg.is_from_me || msg.sender === 'me';
  const text = msg.text || msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.content || '';
  const time = msg.time || formatTime(msg.messageTimestamp || msg.timestamp);
  const status = msg.status;

  const StatusIcon = () => {
    if (!isMe) return null;
    if (status === 'sending') return <span style={{ fontSize: 10, color: '#8696a0' }}>⏳</span>;
    if (status === 'read' || status >= 3) return <Icon.CheckDouble color="#53bdeb" />;
    return <Icon.CheckDouble color="#8696a0" />;
  };

  return (
    <div>
      {showDate && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
          <span style={{
            background: '#1f2c34', color: '#e9edef', fontSize: 11, fontWeight: 500,
            padding: '4px 12px', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,.3)',
          }}>
            {showDate}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2, padding: '1px 16px' }}>
        <div style={{
          maxWidth: '65%', minWidth: 80,
          background: isMe ? '#005c4b' : '#1f2c34',
          borderRadius: isMe ? '8px 0 8px 8px' : '0 8px 8px 8px',
          padding: '6px 9px 7px',
          boxShadow: '0 1px 1px rgba(0,0,0,.2)',
          position: 'relative',
        }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#e9edef', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {text}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: '#8696a0', whiteSpace: 'nowrap' }}>{time}</span>
            <StatusIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DateSeparator helper ─────────────────────────────────────────────────────
const getMsgDate = (msg) => {
  const t = msg.messageTimestamp?.low || msg.messageTimestamp || msg.timestamp;
  if (!t) return null;
  const d = new Date(t < 1e12 ? t * 1000 : t);
  if (isNaN(d)) return null;
  const now = new Date();
  const diff = now.setHours(0,0,0,0) - d.setHours(0,0,0,0);
  if (diff === 0) return 'Hari ini';
  if (diff === 86400000) return 'Kemarin';
  return new Date(t < 1e12 ? t * 1000 : t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#0a1929', padding: 40,
    borderLeft: '0.5px solid rgba(134,150,160,0.15)',
  }}>
    <svg viewBox="0 0 303 172" width="280" style={{ opacity: 0.12, marginBottom: 24 }}>
      <rect x="10" y="20" width="80" height="130" rx="6" fill="#aebac1"/>
      <rect x="110" y="40" width="180" height="110" rx="6" fill="#aebac1"/>
      <rect x="120" y="55" width="100" height="8" rx="4" fill="#111b21"/>
      <rect x="120" y="72" width="140" height="8" rx="4" fill="#111b21"/>
      <rect x="120" y="89" width="80" height="8" rx="4" fill="#111b21"/>
    </svg>
    <h2 style={{ color: '#e9edef', fontSize: 28, fontWeight: 300, margin: '0 0 12px', letterSpacing: -.3 }}>
      WhatsApp untuk Bot POS
    </h2>
    <p style={{ color: '#8696a0', fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 1.7, margin: '0 0 24px' }}>
      Kirim dan terima pesan dengan pelanggan Anda. Pilih bot di atas, lalu klik chat untuk memulai.
    </p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8696a0', fontSize: 12 }}>
      <Icon.Lock />
      <span>Pesan terenkripsi end-to-end</span>
    </div>
  </div>
);

// ─── NewChatModal ─────────────────────────────────────────────────────────────
const NewChatModal = ({ contacts, onSelect, onClose }) => {
  const [q, setQ] = useState('');
  const { data: customers = [], isLoading } = useCustomerSearch(q, null, { enabled: q.length > 2 });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111b21', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 400,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -4px 32px rgba(0,0,0,.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#e9edef' }}>Mulai Chat Baru</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 4 }}>
            <Icon.Close />
          </button>
        </div>
        <div style={{ padding: '4px 16px 8px' }}>
          <div style={{ background: '#2a3942', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 8 }}>
            <span style={{ color: '#8696a0', flexShrink: 0 }}><Icon.Search /></span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cari nama atau nomor HP..."
              autoFocus
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#e9edef', fontSize: 14, flex: 1, fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8696a0', fontSize: 13 }}>Mencari...</div>
          ) : customers.length > 0 ? customers.map(c => {
            const phone = normalizePhone(c.telepon || c.no_hp || '');
            if (!phone) return null;
            return (
              <button
                key={c.id}
                onClick={() => {
                  const jid = `${phone}@s.whatsapp.net`;
                  const existing = contacts.find(x => x.jid === jid);
                  onSelect(existing || { jid, name: c.nama, avatar: null, unreadCount: 0 });
                  onClose();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '10px 16px', background: 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1f2c34'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Avatar name={c.nama} size={44} />
                <div>
                  <div style={{ fontSize: 14, color: '#e9edef', fontWeight: 500 }}>{c.nama}</div>
                  <div style={{ fontSize: 12, color: '#8696a0' }}>+{phone}</div>
                </div>
              </button>
            );
          }) : q.length > 2 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8696a0', fontSize: 13 }}>Tidak ada pelanggan ditemukan.</div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#8696a0', fontSize: 13 }}>Ketik minimal 3 karakter untuk mencari.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main ChatPage ─────────────────────────────────────────────────────────────
const ChatPage = () => {
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Bot configs ──
  const { data: botConfigs = [], isLoading: loadingBots } = useBotConfigs();

  useEffect(() => {
    if (botConfigs.length > 0 && !selectedBotId) {
      const active = botConfigs.find(b => b.is_active) || botConfigs[0];
      setSelectedBotId(active.bot_config_id);
    }
  }, [botConfigs, selectedBotId]);

  // ── Status & chats ──
  const { data: botStatus } = useWhatsappStatus(selectedBotId);

  const { data: contacts = [], refetch: refetchChats } = useWhatsappChats({
    botId: selectedBotId,
    limit: 50,
  });

  // ── Filtered contacts (search) ──
  const filteredContacts = contacts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const jid = (c.jid || '').toLowerCase();
    return name.includes(q) || jid.includes(q);
  });

  // ── Messages ──
  const { data: messages = [], isLoading: loadingMessages } = useWhatsappMessages(
    selectedChat?.jid,
    { botId: selectedBotId, limit: 50 }
  );

  const sendMessageMutation = useWhatsappSendMessage();

  // ── Scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Socket ──
  useEffect(() => {
    const handler = (event) => {
      if (event.type !== 'message' || !event.data) return;
      const d = event.data;
      const normalize = (jid) => (jid || '').replace('@s.whatsapp.net', '');
      const selJid = normalize(selectedChat?.jid);
      const msgJid = normalize(d.chat_id || d.key?.remoteJid);

      if (selJid && msgJid === selJid) {
        const isMe = d.from_me || d.is_from_me || d.key?.fromMe || false;
        const newMsg = {
          id: d.id || d.key?.id,
          text: d.body || d.message?.conversation || d.message?.extendedTextMessage?.text || '',
          sender: isMe ? 'me' : 'other',
          time: formatTime(d.timestamp),
          timestamp: d.timestamp,
          status: 'received',
          fromMe: isMe,
          ...d,
        };
        queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (old = []) => {
          if (old.some(m => m.id === newMsg.id)) return old;
          return [...old, newMsg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
      refetchChats();
    };
    socket.on('whatsapp_message', handler);
    return () => socket.off('whatsapp_message', handler);
  }, [selectedChat, refetchChats, queryClient]);

  // ── Send ──
  const handleSend = useCallback(() => {
    const text = messageInput.trim();
    if (!text || !selectedChat || !selectedBotId) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId, text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(), status: 'sending', fromMe: true, sender: 'me',
    };
    queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (old = []) => [...old, optimistic]);
    setMessageInput('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    sendMessageMutation.mutate(
      { chatJid: selectedChat.jid, message: text, botId: selectedBotId },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (old = []) =>
            old.map(m => m.id === tempId ? { ...m, ...data, status: 'sent', id: data?.messageId || data?.id || tempId } : m)
          );
          refetchChats();
        },
        onError: () => {
          queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (old = []) =>
            old.filter(m => m.id !== tempId)
          );
          setMessageInput(text);
        },
      }
    );
  }, [messageInput, selectedChat, selectedBotId, sendMessageMutation, queryClient, refetchChats]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Build message list with date separators ──
  const enrichedMessages = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const curDate = getMsgDate(msg);
    const prevDate = prev ? getMsgDate(prev) : null;
    return { msg, showDate: curDate !== prevDate ? curDate : null };
  });

  const isConnected = botStatus?.state === 'logged_in';
  const selectedContactInfo = contacts.find(c => c.jid === selectedChat?.jid) || selectedChat;

  // ─ Responsive: on mobile, show either sidebar or chat
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const showSidebar = !isMobile || !selectedChat;
  const showChat = !isMobile || !!selectedChat;

  return (
    <>
      {showNewChat && (
        <NewChatModal
          contacts={contacts}
          onSelect={setSelectedChat}
          onClose={() => setShowNewChat(false)}
        />
      )}

      <div style={{
        display: 'flex', height: 'calc(100vh - 64px)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,.5)',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        border: '0.5px solid rgba(134,150,160,0.15)',
      }}>

        {/* ════ SIDEBAR ════ */}
        {showSidebar && (
          <div style={{
            width: isMobile ? '100%' : 360, minWidth: isMobile ? 'auto' : 300,
            background: '#111b21', display: 'flex', flexDirection: 'column',
            borderRight: '0.5px solid rgba(134,150,160,0.15)',
            flexShrink: 0,
          }}>

            {/* Sidebar Header */}
            <div style={{ padding: '10px 16px 6px', background: '#202c33', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#aebac1',
                  }}>
                    <Icon.Bot />
                  </div>
                  <span style={{ color: '#e9edef', fontSize: 16, fontWeight: 500 }}>Pesan</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setShowNewChat(true)}
                    title="Chat baru"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#aebac1', padding: 8, borderRadius: '50%', transition: 'background .12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2a3942'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Icon.NewChat />
                  </button>
                  <button
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#aebac1', padding: 8, borderRadius: '50%', transition: 'background .12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2a3942'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Icon.Menu />
                  </button>
                </div>
              </div>

              {/* Bot Selector */}
              {!loadingBots && botConfigs.length > 0 && (
                <BotSelector
                  bots={botConfigs}
                  selectedBotId={selectedBotId}
                  onSelect={setSelectedBotId}
                  status={botStatus}
                />
              )}

              {/* Connection warning */}
              {selectedBotId && !isConnected && (
                <div style={{
                  marginTop: 6, padding: '5px 10px', background: '#a3000020',
                  border: '0.5px solid #a3000040', borderRadius: 6,
                  fontSize: 11, color: '#f97066', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97066', flexShrink: 0, display: 'inline-block' }} />
                  Bot tidak terhubung. Scan QR di halaman konfigurasi.
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{ padding: '8px 12px', background: '#111b21', flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#2a3942', borderRadius: 8, padding: '8px 12px',
              }}>
                <span style={{ color: '#8696a0', flexShrink: 0 }}><Icon.Search /></span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari atau mulai chat baru"
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    color: '#e9edef', fontSize: 14, flex: 1,
                    fontFamily: 'inherit',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', padding: 0 }}
                  >
                    <Icon.Close />
                  </button>
                )}
              </div>
            </div>

            {/* Chat List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!selectedBotId ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#8696a0', fontSize: 13 }}>
                  Pilih bot untuk melihat chat.
                </div>
              ) : filteredContacts.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#8696a0', fontSize: 13 }}>
                  {searchQuery ? 'Tidak ada hasil pencarian.' : 'Belum ada chat.'}
                </div>
              ) : filteredContacts.map(contact => (
                <ChatListItem
                  key={contact.jid}
                  contact={contact}
                  selected={selectedChat?.jid === contact.jid}
                  onClick={() => { setSelectedChat(contact); inputRef.current?.focus(); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ════ CHAT AREA ════ */}
        {showChat && (
          selectedChat ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a1929', minWidth: 0 }}>

              {/* Chat Header */}
              <div style={{
                background: '#202c33', padding: '10px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {isMobile && (
                    <button
                      onClick={() => setSelectedChat(null)}
                      style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', padding: '4px 8px 4px 0' }}
                    >
                      <Icon.Back />
                    </button>
                  )}
                  <Avatar
                    name={selectedContactInfo?.name || selectedChat.jid?.replace('@s.whatsapp.net', '')}
                    src={selectedContactInfo?.avatar}
                    size={40}
                    online={isConnected}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedContactInfo?.name || selectedChat.jid?.replace('@s.whatsapp.net', '')}
                    </div>
                    <div style={{ fontSize: 12, color: isConnected ? '#25d366' : '#8696a0' }}>
                      {isConnected ? 'online' : 'offline'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {[Icon.Search, Icon.Menu].map((Ic, i) => (
                    <button
                      key={i}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#aebac1', padding: 8, borderRadius: '50%', transition: 'background .12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2a3942'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Ic />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1, overflowY: 'auto', padding: '8px 0',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%230a1929'/%3E%3Ccircle cx='40' cy='40' r='1' fill='%23ffffff06'/%3E%3C/svg%3E")`,
                }}
              >
                {loadingMessages && messages.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: '#8696a0', fontSize: 13 }}>
                    Memuat pesan...
                  </div>
                )}
                {enrichedMessages.map(({ msg, showDate }, i) => (
                  <MessageBubble key={msg.id || i} msg={msg} showDate={showDate} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{
                background: '#202c33', padding: '10px 12px',
                display: 'flex', alignItems: 'flex-end', gap: 8, flexShrink: 0,
              }}>
                <button
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#aebac1', padding: 8, borderRadius: '50%', flexShrink: 0, transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2a3942'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Icon.Emoji />
                </button>
                <button
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#aebac1', padding: 8, borderRadius: '50%', flexShrink: 0, transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2a3942'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Icon.Attach />
                </button>

                <div style={{ flex: 1, background: '#2a3942', borderRadius: 10, padding: '9px 14px', minHeight: 42, display: 'flex', alignItems: 'center' }}>
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={e => {
                      setMessageInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan"
                    rows={1}
                    style={{
                      background: 'none', border: 'none', outline: 'none',
                      color: '#e9edef', fontSize: 15, width: '100%', resize: 'none',
                      fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 120,
                      overflowY: 'auto',
                    }}
                  />
                </div>

                <button
                  onClick={messageInput.trim() ? handleSend : undefined}
                  disabled={sendMessageMutation.isPending}
                  style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: messageInput.trim() ? '#00a884' : '#2a3942',
                    border: 'none', cursor: messageInput.trim() ? 'pointer' : 'default',
                    color: messageInput.trim() ? '#fff' : '#aebac1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .2s, color .2s',
                  }}
                >
                  {messageInput.trim() ? <Icon.Send /> : <Icon.Mic />}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState />
          )
        )}
      </div>
    </>
  );
};

export default ChatPage;