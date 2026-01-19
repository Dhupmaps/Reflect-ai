import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Moon, Sun, MoreVertical, Search, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { createPortal } from 'react-dom';

const Sidebar = ({
    isOpen,
    toggleSidebar,
    createNewChat,
    chats,
    activeChatId,
    loadChat,
    deleteChat
}) => {
    const { theme, toggleTheme } = useTheme();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = chats.filter(chat =>
        (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMenu = (e, chatId) => {
        e.stopPropagation();
        if (openMenuId === chatId) {
            setOpenMenuId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 5,
                left: rect.left - 100 // Align to left of button since sidebar is on right
            });
            setOpenMenuId(chatId);
        }
    };

    const handleDelete = (e, chatId) => {
        e.stopPropagation();
        deleteChat(chatId);
        setOpenMenuId(null);
    };

    useEffect(() => {
        const closeMenu = () => setOpenMenuId(null);
        if (openMenuId) window.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeMenu, true);
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
        };
    }, [openMenuId]);

    const DropdownMenu = ({ chatId, onDelete, position }) => {
        return createPortal(
            <div
                className="dropdown-menu-fixed"
                style={{ top: position.top, left: position.left }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="dropdown-item delete" onClick={(e) => onDelete(e, chatId)}>
                    <Trash2 size={14} />
                    <span>Delete</span>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className={`right-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="right-sidebar-header">
                <h3>Chat History</h3>
                <button className="new-chat-icon-btn" onClick={createNewChat} title="New Chat">
                    <Plus size={18} />
                    <span>New Chat</span>
                </button>
            </div>

            <div className="search-bar">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="chats-list chat-scroll-area-sidebar">
                <div className="list-section-title">Today</div>
                {filteredChats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`chat-item-right ${activeChatId === chat.id ? 'active' : ''}`}
                        onClick={() => loadChat(chat.id)}
                    >
                        <span className="chat-title-right">
                            {chat.title === 'New Conversation' ? 'New Chat' : (chat.title || 'New Chat')}
                        </span>

                        <div className="menu-trigger" onClick={(e) => toggleMenu(e, chat.id)}>
                            <MoreVertical size={14} />
                        </div>
                    </div>
                ))}
            </div>

            {openMenuId && (
                <DropdownMenu
                    chatId={openMenuId}
                    onDelete={handleDelete}
                    position={menuPosition}
                />
            )}

            <div className="right-sidebar-footer">
                <button className="collapse-btn" onClick={toggleSidebar}>
                    {isOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                    <span>Collapse</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
