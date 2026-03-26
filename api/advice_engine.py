"""Generate improvement advice based on voice analysis."""


def generate_advice(
    voice_type: str,
    brightness: float,
    breathiness: float,
    nasality: float,
    stability_score: float,
    f0_std: float,
    exercise_type: str,
) -> dict:
    """
    Generate personalized strengths, improvements, and next exercise suggestion.
    MVP: rule-based. Post-MVP: LLM-powered.
    """
    strengths: list[str] = []
    improvements: list[str] = []

    # Stability
    if stability_score >= 80:
        strengths.append("音程の安定感が素晴らしいです！")
    elif stability_score >= 60:
        strengths.append("音程は概ね安定しています")
    else:
        improvements.append("音程が不安定な箇所があります。ロングトーン練習で安定性を高めましょう")

    # Breathiness
    if breathiness < 0.3:
        strengths.append("声に芯があり、クリアな発声ができています")
    elif breathiness < 0.6:
        pass  # Normal range, no comment
    else:
        improvements.append("息漏れが多めです。腹式呼吸を意識して声帯をしっかり閉じましょう")

    # Brightness
    if 0.3 <= brightness <= 0.7:
        strengths.append("声の明るさのバランスが良いです")
    elif brightness > 0.7:
        improvements.append("声が少し細くなっています。喉を開いてリラックスした発声を心がけましょう")
    else:
        improvements.append("声がこもり気味です。口をしっかり開けて、前方に声を飛ばすイメージで歌いましょう")

    # Nasality
    if nasality > 0.7:
        improvements.append("鼻声の傾向があります。軟口蓋を上げる意識で改善できます")

    # F0 variation (vibrato potential)
    if f0_std > 15 and stability_score >= 60:
        strengths.append("自然なビブラートの傾向が見られます")
    elif f0_std > 30:
        improvements.append("ピッチの揺れが大きいです。まっすぐ伸ばす練習をしましょう")

    # Ensure at least one item each
    if not strengths:
        strengths.append("練習を継続していて素晴らしいです！")
    if not improvements:
        improvements.append("現在のレベルを維持しつつ、新しいテクニックに挑戦しましょう")

    # Next exercise suggestion
    next_exercise = _suggest_next_exercise(
        stability_score, breathiness, exercise_type
    )

    return {
        "strengths": strengths,
        "improvements": improvements,
        "nextExercise": next_exercise,
    }


def _suggest_next_exercise(
    stability_score: float,
    breathiness: float,
    current_exercise: str,
) -> str:
    """Suggest the next exercise based on weak points."""
    if stability_score < 60:
        return "ロングトーン練習で音程の安定性を鍛えましょう"
    if breathiness > 0.6:
        return "腹式呼吸のエクササイズで息のコントロールを改善しましょう"
    if current_exercise == "scale":
        return "ピッチマッチングで音感をさらに鍛えましょう"
    if current_exercise == "long-tone":
        return "スケール練習で音程の移動をスムーズにしましょう"
    if current_exercise == "pitch-match":
        return "ロングトーンで持続力と安定性を高めましょう"
    return "デイリートレーニングで総合的にスキルアップしましょう"
