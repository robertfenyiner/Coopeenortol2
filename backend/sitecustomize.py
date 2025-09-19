"""Ajustes globales para compatibilidad con Python 3.12."""

import inspect
import typing

_forward_eval = typing.ForwardRef._evaluate  # type: ignore[attr-defined]
_signature = inspect.signature(_forward_eval)

if "recursive_guard" in _signature.parameters:
    def _patched_evaluate(self, globalns, localns, type_params=None, *, recursive_guard=None):  # type: ignore[override]
        if recursive_guard is None:
            recursive_guard = set()
        return _forward_eval(self, globalns, localns, type_params, recursive_guard=recursive_guard)

    typing.ForwardRef._evaluate = _patched_evaluate  # type: ignore[assignment]
