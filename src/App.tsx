import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowDown, ArrowUpRight, Check, LogOut, MessageCircle, Paperclip, Radio, Send, Smile, Users } from 'lucide-react'
import { login, register } from './api'
import type { Tokens } from './api'

type ChatMessage = { sender: string; text: string; timestamp: number }
type SocketStatus = 'connecting' | 'online' | 'offline' | 'error'

const socketUrl = 'wss://inai-col3.fishrungames.com/chat/'
const savedTokens = (): Tokens | null => {
  const access = localStorage.getItem('access')
  if (!access) return null
  const refresh = localStorage.getItem('refresh')
  return { access, refresh: refresh ?? undefined }
}
const initialMessages: ChatMessage[] = []

function App() {
  const [tokens, setTokens] = useState<Tokens | null>(savedTokens)
  const [username, setUsername] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<SocketStatus>('connecting')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tokens?.access) {
      setStatus('offline')
      return
    }
    setStatus('connecting')
    const socket = new WebSocket(socketUrl)
    socketRef.current = socket

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'AUTH', payload: { token: tokens.access } }))
    }
    socket.onmessage = (event) => {
      let packet: { type?: string; payload?: Record<string, unknown> }
      try { packet = JSON.parse(event.data as string) } catch { return }
      if (packet.type === 'AUTH_SUCCESS') {
        setUsername(String(packet.payload?.username ?? ''))
        setStatus('online')
      }
      if (packet.type === 'NEW_MESSAGE' && packet.payload) {
        const { sender, text, timestamp } = packet.payload
        if (typeof sender === 'string' && typeof text === 'string' && typeof timestamp === 'number') {
          setMessages((current) => [...current, { sender, text, timestamp }])
        }
      }
    }
    socket.onerror = () => setStatus('error')
    socket.onclose = () => {
      socketRef.current = null
      setStatus((current) => current === 'error' ? 'error' : 'offline')
    }

    return () => {
      socket.onclose = null
      socket.close()
      socketRef.current = null
    }
  }, [tokens?.access])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const user = String(form.get('username') ?? '').trim()
    const password = String(form.get('password') ?? '')
    try {
      if (authMode === 'register') await register(user, password)
      const nextTokens = await login(user, password)
      localStorage.setItem('access', nextTokens.access)
      if (nextTokens.refresh) localStorage.setItem('refresh', nextTokens.refresh)
      setUsername(user)
      setTokens(nextTokens)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Что-то пошло не так')
    } finally { setLoading(false) }
  }

  function logout() {
    socketRef.current?.close()
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setTokens(null)
    setUsername('')
    setMessages([])
    setStatus('offline')
  }

  function sendMessage() {
    const text = draft.trim()
    if (!text || status !== 'online' || socketRef.current?.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify({ type: 'CHAT_MESSAGE', payload: { text } }))
    setDraft('')
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() }
  }

  async function copyInvite() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { /* clipboard may be unavailable */ }
  }

  const statusLabel = { connecting: 'Подключаемся', online: 'В эфире', offline: 'Не подключён', error: 'Нет связи' }[status]

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Круг, на главную"><span className="brand-mark"><MessageCircle size={18} strokeWidth={2.2} /></span><span>круг<span className="brand-dot">.</span></span></a>
        <div className="topbar-center"><span className="live-dot" /> МЕСТО ВСТРЕЧИ</div>
        <div className="topbar-right"><span className="date-stamp">ПОНЕДЕЛЬНИК, 09:41</span><button className="avatar avatar-small" title={username || 'Гость'}>{username ? username.slice(0, 1).toUpperCase() : 'Г'}</button></div>
      </header>

      <section className="layout" id="top">
        <aside className="sidebar">
          <div className="sidebar-topline"><span className="eyebrow">ВАШЕ ПРОСТРАНСТВО</span><button className="icon-button" aria-label="Открыть меню"><span className="dots">···</span></button></div>
          <div className="workspace-card"><div className="workspace-symbol">К</div><div><strong>Креативная кухня</strong><span>Общее пространство</span></div><ArrowDown size={15} /></div>
          <div className="side-section"><div className="section-heading"><span>КАНАЛЫ</span><span className="muted-count">01</span></div><button className="channel active"><span className="hash">#</span><span>общий</span><span className="channel-pulse" /></button><button className="channel muted-channel"><span className="hash">#</span><span>идеи</span><span className="soon">СКОРО</span></button><button className="channel muted-channel"><span className="hash">#</span><span>случайное</span></button><button className="add-channel">＋ <span>Добавить канал</span></button></div>
          <div className="sidebar-note"><span className="note-icon">✳</span><p>Хорошие мысли<br />начинаются с разговора.</p><span className="note-caption">ОСТАВАЙТЕСЬ НА СВЯЗИ</span></div>
          <div className="sidebar-bottom"><div className="tiny-avatar-stack"><i>А</i><i>М</i><i>С</i><i>+</i></div><span>Команда растёт</span></div>
        </aside>

        <section className="chat-panel">
          <div className="chat-header"><div><div className="channel-title"><span className="title-hash">#</span><h1>общий</h1><span className="private-tag">ОТКРЫТЫЙ</span></div><p>Для всего, чем хочется поделиться.</p></div><div className="header-actions"><div className="member-count"><Users size={15} /><span>команда</span></div><button className="invite-button" onClick={copyInvite}><span>{copied ? 'Ссылка скопирована' : 'Пригласить'}</span><ArrowUpRight size={14} /></button></div></div>
          <div className="chat-meta"><span>СЕГОДНЯ</span><i /><span className="status-pill"><b className={`status-light ${status}`} />{statusLabel}</span></div>
          <div className="message-list" aria-live="polite">
            {messages.length === 0 ? <div className="empty-state"><div className="empty-art"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit-center"><MessageCircle size={24} /></span><span className="spark spark-one">✳</span><span className="spark spark-two">✳</span></div><span className="eyebrow">НАЧАЛО ИСТОРИИ</span><h2>Тут пока тихо.</h2><p>Поздоровайтесь с командой —<br />пусть разговор начнётся.</p><span className="first-message-hint"><ArrowDown size={14} /> первое сообщение ждёт вас</span></div> : <div className="messages">{messages.map((message, index) => <article className="message" key={`${message.timestamp}-${index}`}><div className="avatar message-avatar">{message.sender.slice(0, 1).toUpperCase()}</div><div className="message-body"><div className="message-info"><strong>{message.sender}</strong><time>{new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></div></article>)}</div>}
            <div ref={bottomRef} />
          </div>

          <div className="composer-wrap"><div className="composer"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKey} placeholder={tokens ? 'Напишите что-нибудь хорошее…' : 'Войдите, чтобы написать сообщение'} disabled={!tokens || status !== 'online'} rows={1} maxLength={2000} aria-label="Текст сообщения" /><div className="composer-tools"><div className="composer-left"><button className="tool-button" aria-label="Прикрепить файл" disabled><Paperclip size={17} /></button><button className="tool-button" aria-label="Добавить реакцию" disabled><Smile size={17} /></button><span className="composer-hint">↵ отправить <span>·</span> ⇧↵ новая строка</span></div><button className="send-button" onClick={sendMessage} disabled={!tokens || status !== 'online' || !draft.trim()} aria-label="Отправить сообщение"><Send size={16} /><span>Отправить</span></button></div></div><div className="composer-foot"><span>Будьте добры друг к другу ✳</span><span>{draft.length}/2000</span></div></div>
        </section>

        <aside className="right-rail"><div className="rail-top"><span className="eyebrow">СЕЙЧАС</span><span className="rail-circle"><Radio size={15} /></span></div><div className="rail-card"><span className="rail-card-label">СОСТОЯНИЕ</span><div className="rail-status"><span className={`status-light ${status}`} />{statusLabel}</div><p>{status === 'online' ? 'Вы в общем канале. Можно писать.' : tokens ? 'Проверяем соединение с чатом.' : 'Войдите, чтобы присоединиться к разговору.'}</p></div><div className="rail-rule" /><div className="rail-members"><div className="rail-heading"><span>УЧАСТНИКИ</span><span className="member-number">{username ? '01' : '—'}</span></div>{username ? <div className="person"><span className="avatar person-avatar">{username.slice(0, 1).toUpperCase()}</span><div><strong>{username}</strong><span>это вы</span></div><span className="online-dot" /></div> : <p className="no-members">Здесь будут те,<br />кто уже вошёл в чат.</p>}<button className="rail-invite" onClick={copyInvite}><span className="plus-box">{copied ? <Check size={14} /> : '＋'}</span>{copied ? 'Ссылка скопирована' : 'Позвать в разговор'}<ArrowUpRight size={14} /></button></div><div className="rail-quote"><span className="quote-mark">“</span><p>Лучшие идеи появляются, когда ими делятся.</p><span className="quote-author">ЗАМЕТКА НА СЕГОДНЯ</span></div><div className="rail-footer"><span className="connected-label"><i className={status === 'online' ? 'connected' : ''} />{status === 'online' ? 'СЕРВЕР НА СВЯЗИ' : 'СОЕДИНЕНИЕ'}</span><span>КРУГ / 01</span></div></aside>
      </section>

      <footer className="page-footer"><span>МАЛЕНЬКИЙ ЧАТ, БОЛЬШИЕ МЫСЛИ.</span><span>СДЕЛАНО ДЛЯ КОМАНДЫ <span className="footer-star">✳</span></span></footer>

      {!tokens && <div className="auth-overlay"><div className="auth-card"><div className="auth-mark"><MessageCircle size={19} /></div><span className="eyebrow">ВАШЕ МЕСТО В КРУГУ</span><h2>{authMode === 'login' ? 'С возвращением.' : 'Рады знакомству.'}</h2><p className="auth-subtitle">{authMode === 'login' ? 'Войдите, чтобы быть на связи.' : 'Создайте аккаунт и присоединяйтесь.'}</p><form onSubmit={handleAuth}><label>Имя пользователя<input name="username" autoComplete="username" placeholder="например, anna" required minLength={3} /></label><label>Пароль<input name="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} placeholder="Не короче 8 символов" required minLength={8} /></label>{error && <p className="auth-error">{error}</p>}<button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Минутку…' : authMode === 'login' ? 'Войти в чат' : 'Зарегистрироваться'}<ArrowUpRight size={16} /></button></form><div className="auth-switch"><span>{authMode === 'login' ? 'Впервые здесь?' : 'Уже есть аккаунт?'}</span><button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError('') }}>{authMode === 'login' ? 'Создать аккаунт' : 'Войти'}</button></div><div className="auth-lock"><span>◈</span> Ваши сообщения видны участникам чата</div></div></div>}
      {tokens && <button className="logout-button" onClick={logout}><LogOut size={15} /> Выйти</button>}
    </main>
  )
}

export default App
