
import { AvatarAction } from './types';

interface ActionButtonsProps {
  currentAction: AvatarAction;
  onAction: (action: AvatarAction) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ currentAction, onAction }) => {
  const buttons: { action: AvatarAction; label: string }[] = [
    { action: 'sit', label: 'Sitt' },
    { action: 'wave', label: 'Vinka' },
    { action: 'dance', label: 'Dansa' },
  ];

  return (
    <div className="action-buttons">
      {buttons.map(({ action, label }) => (
        <button
          key={action}
          className={`pixel-button ${currentAction === action ? 'pixel-button-active' : ''}`}
          onClick={() => onAction(action === currentAction ? 'idle' : action)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
