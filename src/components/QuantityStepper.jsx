import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Quantity selector with − and + buttons.
 *
 *  - Tap + or − to change the number by 1
 *  - Press and HOLD to keep going (handy for bigger groups)
 *  - You can still type a number in the middle
 *  - Never goes below `min` or above `max`
 *
 * Usage:
 *   <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={maxQuantity} />
 */
const QuantityStepper = ({ value, onChange, min = 1, max = 100, disabled = false }) => {
  const current = Number(value) || min;

  // Refs let the press-and-hold timer always see the latest value and callback
  const valueRef = useRef(current);
  const onChangeRef = useRef(onChange);
  const timers = useRef({ delay: null, repeat: null });

  valueRef.current = current;
  onChangeRef.current = onChange;

  // What is shown in the middle box while the person is typing
  const [text, setText] = useState(String(current));
  useEffect(() => {
    setText(String(current));
  }, [current]);

  const clamp = (n) => Math.min(max, Math.max(min, n));

  const step = (direction) => {
    const next = clamp(valueRef.current + direction);
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChangeRef.current(next);
    }
  };

  const stop = () => {
    clearTimeout(timers.current.delay);
    clearInterval(timers.current.repeat);
  };

  const start = (direction) => {
    if (disabled) return;
    stop();
    step(direction); // one step straight away
    // If the button is still held after 0.4s, keep stepping
    timers.current.delay = setTimeout(() => {
      timers.current.repeat = setInterval(() => step(direction), 120);
    }, 400);
  };

  // Stop any running timer if the component disappears
  useEffect(() => stop, []);

  const handleType = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (digits === '') {
      setText('');
      return;
    }
    const next = clamp(parseInt(digits, 10));
    setText(String(next));
    onChange(next);
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = '#eeeeee';
    if (text === '') {
      setText(String(min));
      onChange(min);
    }
  };

  const atMin = current <= min;
  const atMax = current >= max;

  const buttonStyle = (isDisabled) => ({
    width: '56px',
    height: '56px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    border: 'none',
    background: isDisabled ? '#eeeeee' : '#ff5a36',
    color: isDisabled ? '#aaaaaa' : '#ffffff',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    transition: 'background 0.15s ease, transform 0.1s ease',
  });

  const pressHandlers = (direction, isDisabled) => ({
    onPointerDown: (e) => {
      if (isDisabled) return;
      e.preventDefault();
      start(direction);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e) => e.preventDefault(), // stops the long-press menu on phones
    // Keyboard users: Enter or Space gives one step
    onKeyDown: (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
        e.preventDefault();
        step(direction);
      }
    },
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || atMin}
        style={buttonStyle(disabled || atMin)}
        {...pressHandlers(-1, disabled || atMin)}
      >
        <Minus size={22} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={text}
        disabled={disabled}
        onChange={handleType}
        onBlur={handleBlur}
        style={{
          flex: 1,
          minWidth: 0,
          height: '56px',
          textAlign: 'center',
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#111111',
          border: '2px solid #eeeeee',
          borderRadius: '14px',
          background: '#ffffff',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#ff5a36')}
      />

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || atMax}
        style={buttonStyle(disabled || atMax)}
        {...pressHandlers(1, disabled || atMax)}
      >
        <Plus size={22} />
      </button>
    </div>
  );
};

export default QuantityStepper;