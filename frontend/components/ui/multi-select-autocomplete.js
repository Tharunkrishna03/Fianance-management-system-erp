"use client";

import useAutocomplete from '@mui/material/useAutocomplete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { autocompleteClasses } from '@mui/material/Autocomplete';

const Root = styled('div')(({ theme }) => ({
  color: 'rgba(0,0,0,0.85)',
  fontSize: '14px',
}));

const InputWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: '260px',
  border: '1px solid #475569',
  backgroundColor: '#fff',
  borderRadius: '6px',
  padding: '1px',
  display: 'flex',
  flexWrap: 'wrap',
  minHeight: '32px',
  '&:hover': {
    borderColor: '#3b82f6',
  },
  '&.focused': {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
  },
  '& input': {
    backgroundColor: '#fff',
    color: '#111827',
    height: '28px',
    boxSizing: 'border-box',
    padding: '4px 6px',
    width: '0',
    minWidth: '30px',
    flexGrow: 1,
    border: 0,
    margin: 0,
    outline: 0,
  },
}));

function Item(props) {
  const { label, onDelete, ...other } = props;
  return (
    <div {...other}>
      <span>{label}</span>
      <CloseIcon onClick={onDelete} />
    </div>
  );
}

const StyledItem = styled(Item)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  margin: '2px',
  lineHeight: '22px',
  backgroundColor: '#eff6ff',
  border: `1px solid rgba(59, 130, 246, 0.28)`,
  borderRadius: '999px',
  boxSizing: 'content-box',
  padding: '0 4px 0 10px',
  outline: 0,
  overflow: 'hidden',
  fontSize: '12px',
  color: '#1e293b',
  fontWeight: 600,
  '&:focus': {
    borderColor: '#3b82f6',
    backgroundColor: '#dbeafe',
  },
  '& span': {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  '& svg': {
    fontSize: '14px',
    cursor: 'pointer',
    padding: '2px',
    marginLeft: '4px',
    color: '#1d4ed8',
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderRadius: '999px',
  },
  '& svg:hover': {
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
  }
}));

const Listbox = styled('ul')(({ theme }) => ({
  width: '100%',
  maxWidth: '260px',
  margin: '2px 0 0',
  padding: 0,
  position: 'absolute',
  listStyle: 'none',
  backgroundColor: '#fff',
  overflow: 'auto',
  maxHeight: '250px',
  borderRadius: '6px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  zIndex: 10,
  border: '1px solid #e5e7eb',
  '& li': {
    padding: '6px 12px',
    display: 'flex',
    fontSize: '13px',
    color: '#1e293b',
    '& span': {
      flexGrow: 1,
    },
    '& svg': {
      color: 'transparent',
    },
  },
  "& li[aria-selected='true']": {
    backgroundColor: '#f8fafc',
    fontWeight: 600,
    '& svg': {
      color: '#3b82f6',
    },
  },
  [`& li.${autocompleteClasses.focused}`]: {
    backgroundColor: '#eff6ff',
    cursor: 'pointer',
    '& svg': {
      color: 'currentColor',
    },
  },
}));

export default function MultiSelectAutocomplete({ options, value, onChange, placeholder, freeSolo = true }) {
  const {
    getRootProps,
    getInputProps,
    getItemProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value: autocompleteValue,
    focused,
    setAnchorEl,
  } = useAutocomplete({
    multiple: true,
    options: options,
    value: value,
    onChange: (event, newValue) => {
      onChange(newValue);
    },
    freeSolo: freeSolo,
  });

  return (
    <Root>
      <div {...getRootProps()} style={{ position: 'relative' }}>
        <InputWrapper ref={setAnchorEl} className={focused ? 'focused' : ''}>
          {autocompleteValue.map((option, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return (
              <StyledItem
                key={key}
                {...itemProps}
                label={option}
              />
            );
          })}
          <input {...getInputProps()} placeholder={autocompleteValue.length === 0 ? placeholder : ''} />
        </InputWrapper>
        {groupedOptions.length > 0 ? (
          <Listbox {...getListboxProps()}>
            {groupedOptions.map((option, index) => {
              const { key, ...optionProps } = getOptionProps({ option, index });
              return (
                <li key={key} {...optionProps}>
                  <span>{option}</span>
                  <CheckIcon fontSize="small" />
                </li>
              );
            })}
          </Listbox>
        ) : null}
      </div>
    </Root>
  );
}
