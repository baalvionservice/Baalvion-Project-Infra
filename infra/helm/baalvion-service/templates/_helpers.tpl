{{- define "svc.name" -}}
{{- default .Release.Name .Values.nameOverride -}}
{{- end -}}

{{- define "svc.labels" -}}
app.kubernetes.io/name: {{ include "svc.name" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: baalvion
baalvion.io/division: {{ .Values.division }}
baalvion.io/tier: {{ .Values.tier }}
{{- end -}}

{{- define "svc.selector" -}}
app.kubernetes.io/name: {{ include "svc.name" . }}
{{- end -}}
