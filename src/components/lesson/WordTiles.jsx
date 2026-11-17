// =========================================================
// WordTiles — ป้ายคำสำหรับแบบฝึก "เรียงคำเป็นประโยค" (Stage 7)
//   แถวบน = ประโยคของผู้เรียน / แถวล่าง = คำที่ให้มา (ช่องของคำที่ใช้แล้วเว้นว่างไว้ แถวไม่ขยับ)
//   แตะคำล่าง → ต่อท้ายประโยค / แตะคำบน → เอากลับลงไป (ใช้แป้นพิมพ์ได้ — ป้ายคำเป็นปุ่ม)
//   ลากด้วยนิ้ว/เมาส์ (pointer events — HTML5 drag-and-drop ใช้บนจอสัมผัสไม่ได้):
//     ลากไปวางในแถวบน = แทรกตรงตำแหน่งที่ชี้ (มีขีดบอกตำแหน่ง) / ลากคำบนออกนอกแถว = เอากลับลงไป
// props: tiles ([{ id, text }] ลำดับในแถวล่าง), answer ([id] ลำดับในประโยค), onChange(answer ใหม่),
//        marks ({ [id]: 'correct' | 'retry' } หลังตรวจ), disabled
// =========================================================
import { Fragment, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { placeAt } from '../../utils/wordOrder'
import styles from './WordTiles.module.css'

const DRAG_THRESHOLD = 8 // px ที่ต้องขยับก่อนนับว่าเป็นการลาก (น้อยกว่านี้ = แตะ)
const DROP_MARGIN = 24 // px รอบแถวบนที่ยังนับว่าวางในแถว
// ป้ายอยู่แถวไหน
const ANSWER = 'answer'
const BANK = 'bank'

export default function WordTiles({ tiles, answer, onChange, marks, disabled = false }) {
  const { t } = useTranslation()
  const byId = useMemo(() => new Map(tiles.map((tile) => [tile.id, tile])), [tiles])
  const answerRef = useRef(null)
  const pressRef = useRef(null) // ป้ายที่กำลังกดอยู่ { id, from, startX, startY, offsetX, offsetY, width, pointerId, moved }
  const suppressClickRef = useRef(false) // เพิ่งลากเสร็จ → ไม่นับ click ที่ตามมาเป็นการแตะ
  const [drag, setDrag] = useState(null) // { id, x, y, width, over, index }
  const placed = new Set(answer)

  // จุดที่ชี้อยู่ในแถวบน (เผื่อขอบ) ไหม
  function isOverAnswer(x, y) {
    const rect = answerRef.current?.getBoundingClientRect()
    if (!rect) return false
    return x >= rect.left - DROP_MARGIN && x <= rect.right + DROP_MARGIN && y >= rect.top - DROP_MARGIN && y <= rect.bottom + DROP_MARGIN
  }

  // ตำแหน่งที่จะแทรก (นับเฉพาะป้ายอื่นในแถวบน) — แถวตัดบรรทัดได้ จึงดูทั้งแนวตั้งและแนวนอน
  function dropIndex(x, y, draggedId) {
    const others = [...(answerRef.current?.querySelectorAll('[data-tile]') ?? [])].filter(
      (element) => element.dataset.tile !== draggedId,
    )
    const index = others.findIndex((element) => {
      const rect = element.getBoundingClientRect()
      return y < rect.top || (y <= rect.bottom && x < rect.left + rect.width / 2)
    })
    return index < 0 ? others.length : index
  }

  function handlePointerDown(event, id, from) {
    if (disabled || event.button > 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    pressRef.current = {
      id,
      from,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      pointerId: event.pointerId,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event) {
    const press = pressRef.current
    if (!press || press.pointerId !== event.pointerId) return
    if (!press.moved && Math.hypot(event.clientX - press.startX, event.clientY - press.startY) < DRAG_THRESHOLD) return
    press.moved = true
    const over = isOverAnswer(event.clientX, event.clientY)
    setDrag({
      id: press.id,
      x: event.clientX - press.offsetX,
      y: event.clientY - press.offsetY,
      width: press.width,
      over,
      index: over ? dropIndex(event.clientX, event.clientY, press.id) : null,
    })
  }

  function handlePointerUp(event) {
    const press = pressRef.current
    if (!press || press.pointerId !== event.pointerId) return
    pressRef.current = null
    if (!press.moved) return // แตะเฉย ๆ → ให้ onClick จัดการ
    suppressClickRef.current = true
    setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
    if (isOverAnswer(event.clientX, event.clientY)) {
      onChange(placeAt(answer, press.id, dropIndex(event.clientX, event.clientY, press.id)))
    } else if (press.from === ANSWER) {
      onChange(answer.filter((id) => id !== press.id))
    }
    setDrag(null)
  }

  function handlePointerCancel() {
    pressRef.current = null
    setDrag(null)
  }

  function handleClick(id, from) {
    if (disabled || suppressClickRef.current) return
    onChange(from === BANK ? [...answer, id] : answer.filter((item) => item !== id))
  }

  function tileButton(id, from) {
    const tile = byId.get(id)
    const classes = [styles.tile, from === ANSWER && marks?.[id] && styles[marks[id]], drag?.id === id && styles.lifted]
    return (
      <button
        key={id}
        type="button"
        data-tile={from === ANSWER ? id : undefined}
        className={classes.filter(Boolean).join(' ')}
        disabled={disabled}
        aria-label={t(from === BANK ? 'write.tileAdd' : 'write.tileRemove', { word: tile.text })}
        onClick={() => handleClick(id, from)}
        onPointerDown={(event) => handlePointerDown(event, id, from)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        lang="en"
      >
        {tile.text}
      </button>
    )
  }

  // ขีดบอกตำแหน่งที่จะวาง: อยู่หน้าป้ายอื่นลำดับที่ drag.index
  const others = answer.filter((id) => id !== drag?.id)
  const caretAt = drag?.over ? drag.index : null
  const caret = <span className={styles.caret} aria-hidden="true" />

  return (
    <div className={styles.board}>
      <div
        ref={answerRef}
        className={`${styles.answer} ${drag?.over ? styles.answerActive : ''}`}
        role="group"
        aria-label={t('write.tilesAnswer')}
      >
        {answer.length === 0 && !drag && <span className={styles.empty}>{t('write.tilesEmpty')}</span>}
        {answer.map((id) => (
          <Fragment key={id}>
            {caretAt !== null && id !== drag?.id && others.indexOf(id) === caretAt && caret}
            {tileButton(id, ANSWER)}
          </Fragment>
        ))}
        {caretAt !== null && caretAt >= others.length && caret}
      </div>

      <div className={styles.bank} role="group" aria-label={t('write.tilesBank')}>
        {tiles.map((tile) =>
          placed.has(tile.id) ? (
            <span key={tile.id} className={`${styles.tile} ${styles.placeholder}`} aria-hidden="true">
              {tile.text}
            </span>
          ) : (
            tileButton(tile.id, BANK)
          ),
        )}
      </div>

      {drag && (
        <span
          className={`${styles.tile} ${styles.ghost}`}
          style={{ left: drag.x, top: drag.y, width: drag.width }}
          aria-hidden="true"
          lang="en"
        >
          {byId.get(drag.id)?.text}
        </span>
      )}
    </div>
  )
}
